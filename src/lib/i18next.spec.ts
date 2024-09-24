import { test } from 'node:test';
import assert from 'node:assert';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
	readI18nextJson,
	writeI18nextJson,
	identifyUntranslatedStrings,
	applyJsonMergePatch,
	synchronizeI18nextJson,
} from './i18next';

const testDir = path.join(process.cwd(), 'test-files');

test('i18next functions', async (t) => {
	// Setup: Create test directory
	await fs.mkdir(testDir, { recursive: true });

	await t.test('readI18nextJson', async (t) => {
		await t.test('should read and parse JSON file', async () => {
			const testFile = path.join(testDir, 'test-read.json');
			const testData = { key: 'value' };
			await fs.writeFile(testFile, JSON.stringify(testData), 'utf8');

			const result = await readI18nextJson(testFile);
			assert.deepStrictEqual(result, testData);

			// Cleanup
			await fs.unlink(testFile);
		});

		await t.test('should return empty object on error', async () => {
			const result = await readI18nextJson('nonexistent.json');
			assert.deepStrictEqual(result, {});
		});
	});

	await t.test('writeI18nextJson', async () => {
		const testFile = path.join(testDir, 'test-write.json');
		const data = { key: 'value' };
		const result = await writeI18nextJson(testFile, data);

		assert.strictEqual(result, testFile);
		const writtenData = await fs.readFile(testFile, 'utf8');
		assert.strictEqual(writtenData, JSON.stringify(data, null, 2) + '\n');

		// Cleanup
		await fs.unlink(testFile);
	});

	await t.test('writeI18nextJson should write objects in sorted order with newline', async () => {
		const testFile = path.join(testDir, 'test-write-sorted.json');
		const data = {
			c: 'value3',
			a: 'value1',
			b: {
				z: 'nested3',
				x: 'nested1',
				y: 'nested2'
			}
		};
		await writeI18nextJson(testFile, data);

		const writtenData = await fs.readFile(testFile, 'utf8');
		const expectedData = JSON.stringify({
			a: 'value1',
			b: {
				x: 'nested1',
				y: 'nested2',
				z: 'nested3'
			},
			c: 'value3'
		}, null, 2) + '\n';

		assert.strictEqual(writtenData, expectedData);

		// Cleanup
		await fs.unlink(testFile);
	});

	await t.test('writeI18nextJson should throw on error', async () => {
		const invalidFile = path.join(testDir, 'invalid-dir', 'test.json');
		await assert.rejects(async () => await writeI18nextJson(invalidFile, { key: 'value' }), {
			code: 'ENOENT',
		});
	});

	await t.test('identifyUntranslatedStrings', () => {
		const source = {
			key1: 'translated',
			key2: 'to translate',
			nested: {
				key3: 'translated',
				key4: 'also to translate',
			},
		};
		const target = {
			key1: 'translated',
			key2: '',
			nested: {
				key3: 'translated',
			},
			extraKey: 'extra',
		};

		const result = identifyUntranslatedStrings(source, target);
		assert.deepStrictEqual(result, {
			key2: 'to translate',
			nested: {
				key4: 'also to translate',
			},
			extraKey: null,
		});
	});

	await t.test('identifyUntranslatedStrings with empty strings', () => {
		const source = {
			key1: 'value1',
			key2: 'value2',
			nested: {
				key3: 'value3',
				key4: 'value4',
			},
		};
		const target = {
			key1: 'translated1',
			key2: '',
			nested: {
				key3: 'translated3',
				key4: '',
			},
		};

		const result = identifyUntranslatedStrings(source, target);
		assert.deepStrictEqual(result, {
			key2: 'value2',
			nested: {
				key4: 'value4',
			},
		});
	});

	await t.test('identifyUntranslatedStrings with nested objects', () => {
		const source = {
			key1: 'value1',
			nested: {
				key2: 'value2',
				deepNested: {
					key3: 'value3',
				},
			},
		};
		const target = {
			key1: 'translated1',
			nested: {
				key2: 'translated2',
				extraKey: 'extra',
			},
			extraNested: {
				key4: 'extra4',
			},
		};

		const result = identifyUntranslatedStrings(source, target);
		assert.deepStrictEqual(result, {
			nested: {
				deepNested: {
					key3: 'value3',
				},
				extraKey: null,
			},
			extraNested: null,
		});
	});

	await t.test('synchronizeI18nextJson', async (t) => {
		await t.test(
			'should synchronize target with source structure, keeping existing translations and setting new keys to empty string',
			() => {
				const source = {
					key1: 'source1',
					key2: 'source2',
					nested: {
						key3: 'source3',
						key4: 'source4',
					},
				};
				const target = {
					key1: 'target1',
					nested: {
						key3: 'target3',
					},
					extraKey: 'extra',
				};

				const result = synchronizeI18nextJson(source, target);
				assert.deepStrictEqual(result, {
					key1: 'target1',
					key2: '',
					nested: {
						key3: 'target3',
						key4: '',
					},
				});
			}
		);

		await t.test('should remove keys in target that do not exist in source', () => {
			const source = {
				key1: 'source1',
				nested: {
					key3: 'source3',
				},
			};
			const target = {
				key1: 'target1',
				key2: 'target2',
				nested: {
					key3: 'target3',
					key4: 'target4',
				},
				extraNested: {
					key5: 'target5',
				},
			};

			const result = synchronizeI18nextJson(source, target);
			assert.deepStrictEqual(result, {
				key1: 'target1',
				nested: {
					key3: 'target3',
				},
			});
		});
	});

	await t.test('identifyUntranslatedStrings with arrays', () => {
		const source = {
			key1: 'value1',
			key2: ['value2a', 'value2b'],
			nested: {
				key3: ['value3a', 'value3b'],
				key4: 'value4',
			},
		};
		const target = {
			key1: 'translated1',
			key2: ['', ''],
			nested: {
				key3: ['translated3a', ''],
				key4: '',
			},
		};

		const result = identifyUntranslatedStrings(source, target);
		assert.deepStrictEqual(result, {
			key2: ['value2a', 'value2b'],
			nested: {
				key3: ['value3a', 'value3b'],
				key4: 'value4',
			},
		});
	});

	await t.test('identifyUntranslatedStrings with partially translated arrays', () => {
		const source = {
			key1: ['value1a', 'value1b', 'value1c'],
			key2: ['value2a', 'value2b'],
		};
		const target = {
			key1: ['translated1a', '', 'translated1c'],
			key2: ['', 'translated2b'],
		};

		const result = identifyUntranslatedStrings(source, target);
		assert.deepStrictEqual(result, {
			key1: ['value1a', 'value1b', 'value1c'],
			key2: ['value2a', 'value2b'],
		});
	});

	await t.test('synchronizeI18nextJson with arrays', () => {
		const source = {
			key1: 'source1',
			key2: ['source2a', 'source2b'],
			nested: {
				key3: ['source3a', 'source3b'],
				key4: 'source4',
			},
		};
		const target = {
			key1: 'target1',
			key2: ['target2a', ''],
			nested: {
				key3: 'not an array',
				key4: 'target4',
			},
		};

		const result = synchronizeI18nextJson(source, target);
		assert.deepStrictEqual(result, {
			key1: 'target1',
			key2: ['target2a', ''],
			nested: {
				key3: ['', ''],
				key4: 'target4',
			},
		});
	});

	await t.test('applyJsonMergePatch', async (t) => {
		await t.test('should correctly merge a JSON patch into a target object', () => {
			const target = {
				key1: 'value1',
				key2: {
					nestedKey1: 'nestedValue1',
					nestedKey2: 'nestedValue2'
				},
				key3: ['item1', 'item2']
			};
			const patch = {
				key1: 'newValue1',
				key2: {
					nestedKey2: 'newNestedValue2',
					nestedKey3: 'newNestedValue3'
				},
				key3: null,
				key4: 'newValue4'
			};

			const result = applyJsonMergePatch(target, patch);
			assert.deepStrictEqual(result, {
				key1: 'newValue1',
				key2: {
					nestedKey1: 'nestedValue1',
					nestedKey2: 'newNestedValue2',
					nestedKey3: 'newNestedValue3'
				},
				key4: 'newValue4'
			});
		});

		await t.test('should handle nested objects and arrays correctly', () => {
			const target = {
				nested: {
					array: ['1', '2', '3'],
					object: { a: '1', b: '2' }
				}
			};
			const patch = {
				nested: {
					array: ['4', '5'],
					object: { b: '3', c: '4' }
				}
			};

			const result = applyJsonMergePatch(target, patch);
			assert.deepStrictEqual(result, {
				nested: {
					array: ['4', '5'],
					object: { a: '1', b: '3', c: '4' }
				}
			});
		});
	});
});
