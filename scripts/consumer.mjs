import assert from 'node:assert/strict';
import { applyTextPatch } from 'codaro-text-patch';
assert.equal(applyTextPatch('hello world', 'world', 'reader').content, 'hello reader');
assert.equal(applyTextPatch('foo foo', 'foo', 'bar').reason, 'ambiguous');
