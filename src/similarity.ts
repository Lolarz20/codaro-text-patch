import type { Budget } from './limits.js';
/** Unit-cost Levenshtein similarity over UTF-16 code units; no locale or clock dependence. */
export function similarity(a: string, b: string, budget: Budget): number {
  if (!a.length || !b.length) return a === b ? 1 : 0;
  let previous = new Uint32Array(b.length + 1);
  let current = new Uint32Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) previous[j] = j;
  for (let i = 1; i <= a.length; i++) {
    current[0] = i;
    for (let j = 1; j <= b.length; j++) {
      budget.spend(); current[j] = Math.min(previous[j]! + 1, current[j - 1]! + 1, previous[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    [previous, current] = [current, previous];
  }
  return 1 - previous[b.length]! / Math.max(a.length, b.length);
}
