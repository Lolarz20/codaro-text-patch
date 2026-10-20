import { applyTextPatch } from 'codaro-text-patch';
console.log(applyTextPatch('const value = 1;\n', 'const value = 1;', 'const value = 2;'));
// The caller reviews the result and owns persistence. No file is written.
