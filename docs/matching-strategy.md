# Matching strategy

1. Normalize CRLF and CR to LF with a map back to original UTF-16 offsets. KMP finds every overlapping exact occurrence.
2. Collapse runs of spaces/tabs to one space, retaining newlines and maps. This does not merge adjacent words by removing separators.
3. Compare complete line windows after removing leading spaces/tabs. Reindent the replacement relative to its expected first-line prefix.
4. Compare same-line-count windows with unit-cost Levenshtein distance. A length-ratio upper bound filters impossible windows. Each dynamic-programming cell consumes a work unit.
5. Return explicit failure when no candidate passes, several pass, limits are reached, or options are invalid.

Candidates are reported in document order; closest rejected similarity is diagnostic only. Hints explicitly restrict scope and can disambiguate repeated blocks; they are not a preference that silently breaks ties. Threshold equality is inclusive. The engine does not transpose characters specially or reuse the earlier Studio implementation.
