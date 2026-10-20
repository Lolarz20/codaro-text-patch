# Security and limits

All operations are local pure computation over caller strings. No arbitrary code, regular expressions supplied by callers, or file operations are executed. Built-in whitespace regular expressions are linear.

Sizes and offsets use UTF-16 code units. The work counter covers normalization, KMP comparisons, line-window comparison and similarity cells. It is a deterministic algorithm budget, not a claim to count every CPU instruction or every allocation. Input/expected/replacement limits and candidate caps bound allocations before search. Callers can raise limits and are responsible for their resulting resource use. No clock, randomness, locale or global mutable cache affects a result.

Diagnostics contain positions and confidence, not source previews. Ambiguous matches are refused. Even a successful fuzzy match does not authorize an edit; applications should preview and obtain any appropriate authorization before writing. The library never writes files.
