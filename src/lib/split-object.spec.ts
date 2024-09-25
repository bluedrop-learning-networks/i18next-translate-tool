import { describe, it } from 'node:test';
import assert from 'node:assert';
import splitObject from './split-object';
import jsonMergePatch from './json-merge-patch';

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

		const reconstructed = result.reduce((acc, patch) => jsonMergePatch(acc, patch), {});
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
			key2: {
				subkey5: 'value5',
				subkey6: 'value6',
			},
		};

		const result = splitObject(input, 3);

		assert.ok(result.length > 1, 'Result should have more than one part');

		const reconstructed = result.reduce((acc, patch) => jsonMergePatch(acc, patch), {});
		assert.deepStrictEqual(reconstructed, input, 'Reconstructed object should match the input');

		// Additional assertions
		assert.strictEqual(result[0].key1.subkey1, 'value1', 'First part should contain key1.subkey1');
		assert.strictEqual(result[0].key1.subkey2, 'value2', 'First part should contain key1.subkey2');
		assert.strictEqual(result[0].key1.subkey3, 'value3', 'First part should contain key1.subkey3');
		assert.strictEqual(result[1].key1.subkey4, 'value4', 'Second part should contain key1.subkey4');
		assert.strictEqual(result[1].key2.subkey5, 'value5', 'Second part should contain key2.subkey5');
		assert.strictEqual(result[2].key2.subkey6, 'value6', 'Third part should contain key2.subkey6');
	});
});
