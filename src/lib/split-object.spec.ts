import { describe, it } from 'node:test';
import assert from 'node:assert';
import splitObject, { countProperties } from './split-object';
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

		const maxProperties = 3;
		const result = splitObject(input, maxProperties);

		assert.ok(result.length > 1, 'Result should have more than one part');

		const reconstructed = result.reduce((acc, patch) => jsonMergePatch(acc, patch), {});
		assert.deepStrictEqual(reconstructed, input, 'Reconstructed object should match the input');

		result.forEach((part, index) => {
			assert.ok(
				countProperties(part) <= maxProperties,
				`Part ${index} should not exceed ${maxProperties} properties`
			);
		});
	});

	it('should handle nested objects that exceed maxProperties', () => {
		const maxProperties = 3;
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

		const result = splitObject(input, maxProperties);

		assert.strictEqual(result.length, 3, 'Result should have exactly three parts');

		const reconstructed = result.reduce((acc, patch) => jsonMergePatch(acc, patch), {});
		assert.deepStrictEqual(reconstructed, input, 'Reconstructed object should match the input');

		result.forEach((part, index) => {
			assert.ok(
				countProperties(part) <= maxProperties,
				`Part ${index} should not exceed ${maxProperties} properties`
			);
		});

		// Check the content of each part
		assert.deepStrictEqual(result[0], {
			key1: { subkey1: 'value1', subkey2: 'value2', subkey3: 'value3' }
		}, 'First part should contain key1 and its first three subkeys');

		assert.deepStrictEqual(result[1], {
			key1: { subkey4: 'value4' }
		}, 'Second part should contain the remaining subkey of key1');

		assert.deepStrictEqual(result[2], {
			key2: { subkey5: 'value5', subkey6: 'value6' }
		}, 'Third part should contain key2 and its subkeys');
	});
});
