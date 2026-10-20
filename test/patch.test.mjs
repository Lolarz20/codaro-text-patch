import test from 'node:test';
import assert from 'node:assert/strict';
import { applyTextPatch as patch } from '../dist/index.js';
for (const [name, content, expected, replacement, output, kind] of [
  ['exact middle', 'a();\nb();\nc();\n', 'b();', 'B();', 'a();\nB();\nc();\n', 'exact'],
  ['horizontal whitespace', 'return   a +\tb;', 'return a + b;', 'return a - b;', 'return a - b;', 'whitespace'],
  ['indentation', 'class C {\n\tmethod() {\n\t\tdoThing();\n\t}\n}', 'method() {\n\tdoThing();\n}', 'method() {\n\tdoOther();\n}', 'class C {\n\tmethod() {\n\t\tdoOther();\n\t}\n}', 'indentation'],
  ['typo', 'const greeting = "Hello, world!";\nconsole.log(greeting);\n', 'const greeting = "Hello, wrld!";', 'const greeting = "Hi!";', 'const greeting = "Hi!";\nconsole.log(greeting);\n', 'similarity'],
  ['CRLF multiline', 'a();\r\nb();\r\nc();\r\n', 'a();\nb();', 'a();\nB();', 'a();\r\nB();\r\nc();\r\n', 'exact'],
  ['Unicode', 'ą🙂東京', '🙂', '🌱', 'ą🌱東京', 'exact'],
  ['deletion', 'abc', 'b', '', 'ac', 'exact'],
  ['beginning', 'abc', 'a', 'X', 'Xbc', 'exact'],
  ['end', 'abc', 'c', 'X', 'abX', 'exact'],
  ['replacement contains expected', 'foo', 'foo', 'foofoo', 'foofoo', 'exact'],
  ['tab and space', 'a\t +  b', 'a + b', 'z', 'z', 'whitespace'],
  ['empty replacement multiline', 'a\r\nb', 'a\nb', '', '', 'exact']
]) test(name, () => { const result = patch(content, expected, replacement); assert.equal(result.ok, true, JSON.stringify(result)); assert.equal(result.content, output); assert.equal(result.match, kind); assert.ok(result.range.end > result.range.start); });
for (const [name, content, expected, options, reason] of [
  ['empty expected', 'a', '', {}, 'empty_expected'],
  ['repeated exact', 'foo\nfoo', 'foo', {}, 'ambiguous'],
  ['overlapping exact', 'aaaa', 'aa', {}, 'ambiguous'],
  ['repeated whitespace', 'a  b\na\tb', 'a b', {}, 'ambiguous'],
  ['near duplicates', 'const value = 10;\nconst value = 11;', 'const value = 12;', {}, 'ambiguous'],
  ['below threshold', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaXXXXXXXXXXXXXXX', {}, 'below_threshold'],
  ['not found', 'a', 'long long long long text', {}, 'not_found'],
  ['size', '12345', '1', { maxInputSize: 4 }, 'input_too_large'],
  ['expected size', 'abc', 'abc', { maxExpectedSize: 2 }, 'input_too_large'],
  ['replacement size', 'abc', 'abc', { maxReplacementSize: 1 }, 'input_too_large'],
  ['budget', 'abc', 'abc', { maxSearchWork: 1 }, 'search_budget_exceeded'],
  ['candidate cap', 'a\na\na\na', 'a', { maxCandidates: 2 }, 'search_budget_exceeded'],
  ['invalid threshold', 'a', 'a', { similarityThreshold: 2 }, 'invalid_options'],
  ['NaN threshold', 'a', 'a', { similarityThreshold: NaN }, 'invalid_options'],
  ['invalid hint', 'a', 'a', { startLineHint: 0 }, 'invalid_options'],
  ['invalid radius', 'a', 'a', { hintRadius: -1 }, 'invalid_options'],
  ['invalid cap', 'a', 'a', { maxCandidates: 1 }, 'invalid_options']
]) test(name, () => { const result = patch(content, expected, reason === 'input_too_large' ? 'XYZ' : 'X', options); assert.equal(result.ok, false); assert.equal(result.reason, reason, JSON.stringify(result)); assert.ok(Array.isArray(result.candidates)); });
test('explicit positional hint can restrict repeated matches', () => { const result = patch('foo\nbar\nfoo', 'foo', 'X', { startLineHint: 3, hintRadius: 0 }); assert.equal(result.content, 'foo\nbar\nX'); });
test('UTF-16 ranges refer to original CRLF content', () => { const result = patch('🙂\r\na\r\nb', 'a\nb', 'X'); assert.deepEqual(result.range, { start: 4, end: 8 }); });
test('long lines are bounded independently of elapsed time', () => { const content = 'a'.repeat(30_000) + 'Z'; const result = patch(content, 'a'.repeat(3000) + 'X', 'Y', { maxSearchWork: 100_000 }); assert.equal(result.ok, false); assert.equal(result.reason, 'search_budget_exceeded'); });
test('large exact input remains usable', () => { const result = patch('a'.repeat(200_000) + 'UNIQUE', 'UNIQUE', 'X'); assert.equal(result.ok, true); });
test('seeded property corpus: exact roundtrip and stable diagnostics', () => {
  let state = 42;
  const random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state; };
  for (let i = 0; i < 250; i++) {
    const prefix = String(random()), suffix = String(random()), target = `UNIQUE-${i}`;
    const content = prefix + target + suffix;
    const options = Object.freeze({ maxSearchWork: 20_000 });
    const first = patch(content, target, 'REPLACED', options);
    assert.deepEqual(first, patch(content, target, 'REPLACED', options));
    assert.equal(first.content, prefix + 'REPLACED' + suffix);
    assert.equal(content, prefix + target + suffix); assert.equal(options.maxSearchWork, 20_000);
  }
});
test('repetitive hostile input refuses deterministically', () => { const args = ['ab'.repeat(2000), 'ba'.repeat(200) + 'x', 'Y', { maxSearchWork: 10_000 }]; const result = patch(...args); assert.equal(result.reason, 'search_budget_exceeded'); assert.deepEqual(result, patch(...args)); });
