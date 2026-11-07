import assert from 'node:assert/strict';
import { test } from 'node:test';

import { mayUpload } from './policy.ts';

test('manual mode never uploads by itself', () => {
  assert.equal(mayUpload('manual', 'wifi'), false);
});

test('a direct request uploads over any live connection', () => {
  assert.equal(mayUpload('manual', 'cellular', true), true);
  assert.equal(mayUpload('wifi', 'cellular', true), true);
});

test('nothing uploads with no connection, even when asked', () => {
  assert.equal(mayUpload('any', 'none', true), false);
});

test('Wi-Fi mode spares mobile data, and treats an unknown link as mobile', () => {
  assert.equal(mayUpload('wifi', 'wifi'), true);
  assert.equal(mayUpload('wifi', 'cellular'), false);
  assert.equal(mayUpload('wifi', 'other'), false);
});

test('any-connection mode uploads over mobile data', () => {
  assert.equal(mayUpload('any', 'cellular'), true);
});
