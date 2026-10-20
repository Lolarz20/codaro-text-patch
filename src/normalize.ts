import type { Budget } from './limits.js';
export interface Mapped { text: string; starts: number[]; ends: number[] }
/** Normalize line endings while preserving UTF-16 offsets into the original content. */
export function lineEndings(value: string, budget: Budget): Mapped {
  const chars: string[] = [], starts: number[] = [], ends: number[] = [];
  for (let i = 0; i < value.length; i++) {
    budget.spend(); starts.push(i);
    if (value[i] === '\r') { if (value[i + 1] === '\n') i++; chars.push('\n'); }
    else chars.push(value[i]!);
    ends.push(i + 1);
  }
  return { text: chars.join(''), starts, ends };
}
/** Collapse horizontal whitespace, preserving newlines and all non-whitespace characters. */
export function horizontal(value: Mapped, budget: Budget): Mapped {
  const chars: string[] = [], starts: number[] = [], ends: number[] = [];
  for (let i = 0; i < value.text.length; i++) {
    budget.spend(); const begin = i;
    if (value.text[i] === ' ' || value.text[i] === '\t') {
      while (value.text[i + 1] === ' ' || value.text[i + 1] === '\t') { budget.spend(); i++; }
      chars.push(' ');
    } else chars.push(value.text[i]!);
    starts.push(value.starts[begin]!); ends.push(value.ends[i]!);
  }
  return { text: chars.join(''), starts, ends };
}
/** KMP finds overlapping occurrences with a deterministic comparison budget. */
export function occurrences(haystack: string, needle: string, budget: Budget, cap: number): number[] {
  if (!needle) return [];
  const prefix = new Uint32Array(needle.length);
  for (let i = 1, j = 0; i < needle.length; i++) {
    while (j && needle[i] !== needle[j]) { budget.spend(); j = prefix[j - 1]!; }
    budget.spend(); if (needle[i] === needle[j]) j++; prefix[i] = j;
  }
  const matches: number[] = [];
  for (let i = 0, j = 0; i < haystack.length; i++) {
    while (j && haystack[i] !== needle[j]) { budget.spend(); j = prefix[j - 1]!; }
    budget.spend(); if (haystack[i] === needle[j]) j++;
    if (j === needle.length) { matches.push(i - j + 1); if (matches.length >= cap) return matches; j = prefix[j - 1]!; }
  }
  return matches;
}
