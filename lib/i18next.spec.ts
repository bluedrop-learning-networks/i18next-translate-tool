import { test } from 'node:test';
import assert from 'node:assert';
import { readI18nextJson, writeI18nextJson, identifyUntranslatedStrings, mergeI18nextJson } from './i18next';
import fs from 'fs/promises';

// Mock fs.promises
const mockFs = {
  readFile: async (path: string, encoding: string) => '',
  writeFile: async (path: string, data: string, encoding: string) => {},
};

test('i18next functions', async (t) => {
  await t.test('readI18nextJson', async (t) => {
    await t.test('should read and parse JSON file', async () => {
      const mockData = JSON.stringify({ key: 'value' });
      mockFs.readFile = async () => mockData;

      const result = await readI18nextJson('test.json');
      assert.deepStrictEqual(result, { key: 'value' });
    });

    await t.test('should return empty object on error', async () => {
      mockFs.readFile = async () => { throw new Error('File not found'); };

      const result = await readI18nextJson('nonexistent.json');
      assert.deepStrictEqual(result, {});
    });
  });

  await t.test('writeI18nextJson', async () => {
    let writtenData: string | undefined;
    let writtenPath: string | undefined;
    mockFs.writeFile = async (path, data) => { 
      writtenPath = path;
      writtenData = data;
    };

    const data = { key: 'value' };
    const result = await writeI18nextJson('test.json', data);

    assert.strictEqual(result, 'test.json');
    assert.strictEqual(writtenPath, 'test.json');
    assert.strictEqual(writtenData, JSON.stringify(data, null, 2));
  });

  // Update the error handling test
  await t.test('writeI18nextJson should throw on error', async () => {
    mockFs.writeFile = async () => { throw new Error('Write error'); };

    await assert.rejects(
      async () => await writeI18nextJson('test.json', { key: 'value' }),
      { message: 'Write error' }
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
