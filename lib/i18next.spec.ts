import { test } from 'node:test';
import assert from 'node:assert';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { readI18nextJson, writeI18nextJson, identifyUntranslatedStrings, mergeI18nextJson } from './i18next';

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
    await assert.rejects(
      async () => await writeI18nextJson(invalidFile, { key: 'value' }),
      { code: 'ENOENT' }
    );
  });

  await t.test('identifyUntranslatedStrings', () => {
    const json = {
      key1: 'translated',
      key2: '',
      nested: {
        key3: 'translated',
        key4: '',
      },
    };

    const result = identifyUntranslatedStrings(json);
    assert.deepStrictEqual(result, ['key2', 'nested.key4']);
  });

  await t.test('mergeI18nextJson', async (t) => {
    await t.test('should merge source into target, setting new keys to empty string', () => {
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

      const result = mergeI18nextJson(source, target);
      assert.deepStrictEqual(result, {
        key1: 'target1',
        key2: '',
        nested: {
          key3: 'target3',
          key4: '',
        },
      });
    });

    await t.test('should delete keys in target that do not exist in source', () => {
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

      const result = mergeI18nextJson(source, target);
      assert.deepStrictEqual(result, {
        key1: 'target1',
        nested: {
          key3: 'target3',
        },
      });
    });
  });
});
