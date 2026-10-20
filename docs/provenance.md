# Provenance

This matcher was independently implemented for this standalone release from documented behavior and synthetic regression cases. It does not copy the former Studio/Code-OSS patch implementation. The earlier Codaro matcher motivated exact, whitespace, indentation, similarity, CRLF and ambiguity cases; its wall-clock guards and implementation were not imported.

KMP substring search and Levenshtein distance are standard algorithms; the code here was newly written. No Microsoft source implementation or vendor code samples are included. Copyright and MIT terms for Codaro work are preserved in LICENSE. Development dependencies retain their own licenses and are not runtime dependencies.
