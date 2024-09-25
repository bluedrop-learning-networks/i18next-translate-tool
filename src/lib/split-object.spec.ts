import { describe, it } from 'node:test';
import assert from 'node:assert';
import splitObject from './split-object';
import { merge } from 'lodash';

describe('splitObject', () => {
  it('should split a large object into smaller ones', () => {
    const input = {
      key1: 'value1',
      key2: {
        subkey1: 'subvalue1',
        subkey2: 'subvalue2',
      },
      key3: 'value3',
      key4: {
        subkey3: {
          subsubkey1: 'subsubvalue1',
          subsubkey2: 'subsubvalue2',
        },
      },
    };

    const result = splitObject(input, 3);

    assert.ok(result.length > 1, 'Result should have more than one part');

    const reconstructed = result.reduce((acc, patch) => merge({}, acc, patch), {});
    assert.deepStrictEqual(reconstructed, input, 'Reconstructed object should match the input');
  });

  it('should handle nested objects that exceed maxProperties', () => {
    const input = {
      key1: {
        subkey1: 'value1',
        subkey2: 'value2',
        subkey3: 'value3',
        subkey4: 'value4',
      },
    };

    const result = splitObject(input, 2);

    assert.ok(result.length > 1, 'Result should have more than one part');

    const reconstructed = result.reduce((acc, patch) => merge({}, acc, patch), {});
    assert.deepStrictEqual(reconstructed, input, 'Reconstructed object should match the input');
  });
});
