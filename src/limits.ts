export const DEFAULT_LIMITS = Object.freeze({ maxInputSize: 1_048_576, maxExpectedSize: 65_536, maxReplacementSize: 1_048_576, maxCandidates: 128, maxSearchWork: 5_000_000, similarityThreshold: 0.85, hintRadius: 100 });
export class BudgetExceeded extends Error {}
export class Budget {
  work = 0;
  constructor(readonly limit: number) {}
  spend(n = 1): void { if (this.work + n > this.limit) throw new BudgetExceeded(); this.work += n; }
}
