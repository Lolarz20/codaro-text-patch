export type MatchKind = 'exact' | 'whitespace' | 'indentation' | 'similarity';
export interface PatchCandidate { readonly start: number; readonly end: number; readonly confidence: number }
export interface PatchOptions {
  readonly maxInputSize?: number;
  readonly maxExpectedSize?: number;
  readonly maxReplacementSize?: number;
  readonly maxCandidates?: number;
  readonly maxSearchWork?: number;
  readonly similarityThreshold?: number;
  /** 1-based line; together with hintRadius restricts every stage to that line window. */
  readonly startLineHint?: number;
  readonly hintRadius?: number;
}
export type Refusal = 'not_found' | 'ambiguous' | 'below_threshold' | 'input_too_large' | 'search_budget_exceeded' | 'empty_expected' | 'invalid_options';
export type PatchResult = { readonly ok: true; readonly content: string; readonly match: MatchKind; readonly range: { readonly start: number; readonly end: number }; readonly confidence: number; readonly work: number } | { readonly ok: false; readonly reason: Refusal; readonly candidates: readonly PatchCandidate[]; readonly work: number };
