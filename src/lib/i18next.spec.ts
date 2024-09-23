import { test } from 'node:test';
import assert from 'node:assert';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
	readI18nextJson,
	writeI18nextJson,
	identifyUntranslatedStrings,
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
		assert.strictEqual(writtenData, JSON.stringify(data, null, 2));

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
});
