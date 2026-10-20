# Codaro Text Patch

A deterministic, ambiguity-aware text patch engine for coding agents and editor integrations. Direct string replacement misses whitespace and indentation drift; silent fuzzy guessing can edit the wrong block. This library returns a replacement preview or an inspectable refusal.

It is a pure string transformation: no filesystem reads/writes, shell, model calls, account, telemetry or runtime dependencies.

## Install v0.1.0

Node.js 22 and 24 are tested on Windows and Linux. ESM JavaScript and TypeScript declarations are shipped. CommonJS is not included.
Download the tarball and `SHA256SUMS` from [GitHub Releases](https://github.com/Lolarz20/codaro-text-patch/releases/tag/v0.1.0), verify its checksum, then:

```sh
npm install ./codaro-text-patch-0.1.0.tgz
```

The package is not published to npm. Source installation: `npm ci --ignore-scripts && npm run verify`.

```js
import { applyTextPatch } from 'codaro-text-patch';
const result = applyTextPatch('const total = 1;', 'const total = 1;', 'const total = 2;');
if (result.ok) console.log(result.content, result.match, result.range);
else console.log(result.reason, result.candidates);
```

Run `node examples/preview-patch.mjs` for an offline preview. The caller owns review, authorization, and persistence. The library does not write files.

## Matching and refusal

Stages run in order: exact (line endings normalized), horizontal-whitespace normalization, whole-line indentation matching with replacement reindentation, then whole-line Levenshtein similarity. A stage with multiple matches refuses immediately. Similarity accepts only a single candidate above the configured threshold; even a lower-scoring second passing candidate makes the patch ambiguous. It never picks a candidate merely because it appears first.

Ranges are half-open UTF-16 offsets into the original string. Replacement line endings follow CRLF when present in the document, otherwise LF; untouched content is preserved byte-for-code-unit. Unicode is not normalized. Mixed line endings in the replaced block are normalized. Empty expected text is refused; empty replacement deletes a matched block.

Defaults: 1 Mi code units input/replacement, 64 Ki expected, 128 candidate windows, 5,000,000 deterministic work units, similarity threshold 0.85. Options may tune these limits. Work exhaustion returns `search_budget_exceeded`; no wall-clock cutoff changes results across machines. Candidate exhaustion also refuses because uniqueness has not been established. An explicit 1-based `startLineHint` and `hintRadius` restrict every stage; without a hint all occurrences count.

This is not a parser, semantic refactoring engine, diff format, filesystem transaction, or proof that an edit is correct. Similarity only considers complete line windows with the expected line count, so some valid partial-line or reflowed edits are deliberately refused. Whitespace changes can affect program meaning. Review every result. See [matching strategy](docs/matching-strategy.md), [limits](docs/security-and-limits.md) and [provenance](docs/provenance.md).

## Development

`npm run verify` typechecks, lints, builds, runs the offline regression/property corpus with coverage, inspects the packed allowlist and sensitive-content patterns, and installs/tests the tarball with declarations in a fresh consumer. No installation script or automatic publication is configured.

## Codaro Open Source

This project was extracted from engineering work developed while building Codaro.
Focused infrastructure extracted from the engineering work behind Codaro.

Related projects:
- [codaro-agent-protocol](https://github.com/Lolarz20/codaro-agent-protocol)
- [codaro-text-patch](https://github.com/Lolarz20/codaro-text-patch)
- [codaro-local-check](https://github.com/Lolarz20/codaro-local-check)
