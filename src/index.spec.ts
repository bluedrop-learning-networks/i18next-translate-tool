import { test } from 'node:test';
import assert from 'node:assert';

test('translation-tool', async () => {
  await assert.doesNotReject(import('./index'));
});
