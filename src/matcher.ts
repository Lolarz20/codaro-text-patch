import type { MatchKind, PatchCandidate, PatchOptions, PatchResult, Refusal } from './types.js';
import { Budget, BudgetExceeded, DEFAULT_LIMITS } from './limits.js';
import { horizontal, lineEndings, occurrences, type Mapped } from './normalize.js';
import { similarity } from './similarity.js';

export function applyTextPatch(content: string, expected: string, replacement: string, options: PatchOptions = {}): PatchResult {
  const config = { ...DEFAULT_LIMITS, ...options };
  const fail = (reason: Refusal, candidates: readonly PatchCandidate[] = [], work = 0): PatchResult => ({ ok: false, reason, candidates, work });
  for (const key of ['maxInputSize', 'maxExpectedSize', 'maxReplacementSize', 'maxCandidates', 'maxSearchWork'] as const) if (!Number.isSafeInteger(config[key]) || config[key] <= 0) return fail('invalid_options');
  if (config.maxCandidates < 2 || !Number.isFinite(config.similarityThreshold) || config.similarityThreshold < 0 || config.similarityThreshold > 1 || !Number.isSafeInteger(config.hintRadius) || config.hintRadius < 0 || (config.startLineHint !== undefined && (!Number.isSafeInteger(config.startLineHint) || config.startLineHint < 1))) return fail('invalid_options');
  if (!expected.length) return fail('empty_expected');
  if (content.length > config.maxInputSize || expected.length > config.maxExpectedSize || replacement.length > config.maxReplacementSize) return fail('input_too_large');
  const budget = new Budget(config.maxSearchWork);
  try {
    const original = lineEndings(content, budget);
    const target = lineEndings(expected, budget);
    const insertion = lineEndings(replacement, budget).text;
    const lines = original.text.split('\n');
    const offsets: number[] = [];
    let offset = 0;
    for (const line of lines) { budget.spend(); offsets.push(offset); offset += line.length + 1; }
    const originalOffsets = offsets.map(index => original.starts[index] ?? content.length);
    const inHint = (start: number) => {
      if (config.startLineHint === undefined) return true;
      // Binary search avoids a linear line-count per candidate.
      let low = 0, high = offsets.length;
      while (low < high) { budget.spend(); const mid = (low + high) >>> 1; if (originalOffsets[mid]! <= start) low = mid + 1; else high = mid; }
      return Math.abs(low - config.startLineHint) <= config.hintRadius;
    };
    const candidate = (map: Mapped, start: number, length: number, confidence = 1): PatchCandidate => ({ start: map.starts[start]!, end: map.ends[start + length - 1]!, confidence });
    const apply = (kind: MatchKind, found: readonly PatchCandidate[], adjusted = insertion): PatchResult => {
      if (found.length !== 1) return fail('ambiguous', found, budget.work);
      const chosen = found[0]!;
      const eol = content.includes('\r\n') ? '\r\n' : '\n';
      const text = adjusted.replace(/\n/g, eol);
      return { ok: true, content: content.slice(0, chosen.start) + text + content.slice(chosen.end), match: kind, range: { start: chosen.start, end: chosen.end }, confidence: chosen.confidence, work: budget.work };
    };
    // Search the whole map before applying a hint; hints never silently select the first occurrence.
    const locate = (map: Mapped, needle: string) => {
      const matches = occurrences(map.text, needle, budget, config.maxCandidates + 1);
      if (matches.length > config.maxCandidates) throw new BudgetExceeded();
      return matches.filter(i => inHint(map.starts[i]!)).map(i => candidate(map, i, needle.length));
    };
    let found = locate(original, target.text);
    if (found.length) return apply('exact', found);
    const compact = horizontal(original, budget), needle = horizontal(target, budget).text;
    found = locate(compact, needle);
    if (found.length) return apply('whitespace', found);
    const expectedLines = target.text.split('\n');
    const trimExpected = expectedLines.map(l => l.replace(/^[ \t]*/, '')).join('\n');
    const indented: PatchCandidate[] = [];
    let newIndent = '';
    for (let i = 0; i + expectedLines.length <= lines.length; i++) {
      budget.spend(); if (!inHint(originalOffsets[i]!)) continue;
      const window = lines.slice(i, i + expectedLines.length);
      budget.spend(window.reduce((n, line) => n + line.length, 0));
      if (window.some(line => line.length > 0) && window.map(l => l.replace(/^[ \t]*/, '')).join('\n') === trimExpected) {
        const end = offsets[i]! + window.join('\n').length;
        indented.push(candidate(original, offsets[i]!, end - offsets[i]!));
        newIndent = /^[ \t]*/.exec(window[0]!)![0];
        if (indented.length > config.maxCandidates) throw new BudgetExceeded();
      }
    }
    if (indented.length) {
      const sourceIndent = /^[ \t]*/.exec(expectedLines[0]!)![0];
      const adjusted = insertion.split('\n').map(l => newIndent + (l.startsWith(sourceIndent) ? l.slice(sourceIndent.length) : l)).join('\n');
      return apply('indentation', indented, adjusted);
    }
    // Similarity examines complete line windows with the expected line count; no arbitrary substring guessing.
    const fuzzy: PatchCandidate[] = [];
    let best: PatchCandidate | undefined;
    let evaluated = 0;
    for (let i = 0; i + expectedLines.length <= lines.length; i++) {
      budget.spend(); if (!inHint(originalOffsets[i]!)) continue;
      const window = lines.slice(i, i + expectedLines.length).join('\n');
      budget.spend(window.length);
      if (Math.min(window.length, target.text.length) / Math.max(window.length, target.text.length) < config.similarityThreshold) continue;
      if (++evaluated > config.maxCandidates) throw new BudgetExceeded();
      const score = similarity(window, target.text, budget);
      if (!window.length) continue;
      const current = candidate(original, offsets[i]!, window.length, score);
      if (!best || current.confidence > best.confidence) best = current;
      if (score >= config.similarityThreshold) fuzzy.push(current);
    }
    if (fuzzy.length) return apply('similarity', fuzzy);
    return fail(best ? 'below_threshold' : 'not_found', best ? [best] : [], budget.work);
  } catch (error) { if (error instanceof BudgetExceeded) return fail('search_budget_exceeded', [], budget.work); throw error; }
}
