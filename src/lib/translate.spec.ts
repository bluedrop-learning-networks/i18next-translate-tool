import { test } from 'node:test';
import assert from 'node:assert';
import { translate } from './translate';

test('translate function', async (t) => {
  await t.test('should translate source object to target language', async () => {
    const source = {
      greeting: 'Hello',
      farewell: 'Goodbye',
      nested: {
        message: 'How are you?'
      }
    };
    const sourceLanguage = 'en';
    const targetLanguage = 'es';

    const result = await translate(source, sourceLanguage, targetLanguage);

    assert.deepStrictEqual(Object.keys(result), Object.keys(source));
    assert.strictEqual(typeof result.greeting, 'string');
    assert.strictEqual(typeof result.farewell, 'string');
    assert.strictEqual(typeof result.nested.message, 'string');
    assert.notStrictEqual(result.greeting, source.greeting);
    assert.notStrictEqual(result.farewell, source.farewell);
    assert.notStrictEqual(result.nested.message, source.nested.message);
  });

  await t.test('should use existing translations from target when provided', async () => {
    const source = {
      greeting: 'Hello',
      farewell: 'Goodbye',
      newKey: 'New content'
    };
    const target = {
      greeting: 'Hola',
      farewell: 'Adiós'
    };
    const sourceLanguage = 'en';
    const targetLanguage = 'es';

    const result = await translate(source, sourceLanguage, targetLanguage, target);

    assert.deepStrictEqual(Object.keys(result), Object.keys(source));
    assert.strictEqual(result.greeting, 'Hola');
    assert.strictEqual(result.farewell, 'Adiós');
    assert.strictEqual(typeof result.newKey, 'string');
    assert.notStrictEqual(result.newKey, source.newKey);
  });

  await t.test('should handle nested objects', async () => {
    const source = {
      top: 'Top level',
      nested: {
        middle: 'Middle level',
        deep: {
          bottom: 'Bottom level'
        }
      }
    };
    const sourceLanguage = 'en';
    const targetLanguage = 'fr';

    const result = await translate(source, sourceLanguage, targetLanguage);

    assert.deepStrictEqual(Object.keys(result), Object.keys(source));
    assert.deepStrictEqual(Object.keys(result.nested), Object.keys(source.nested));
    assert.deepStrictEqual(Object.keys(result.nested.deep), Object.keys(source.nested.deep));
    assert.strictEqual(typeof result.top, 'string');
    assert.strictEqual(typeof result.nested.middle, 'string');
    assert.strictEqual(typeof result.nested.deep.bottom, 'string');
    assert.notStrictEqual(result.top, source.top);
    assert.notStrictEqual(result.nested.middle, source.nested.middle);
    assert.notStrictEqual(result.nested.deep.bottom, source.nested.deep.bottom);
  });

  await t.test('should remove keys from target that are not in source', async () => {
    const source = {
      keep: 'Keep this',
      nested: {
        alsoKeep: 'Keep this too'
      }
    };
    const target = {
      keep: 'Mantener esto',
      remove: 'Eliminar esto',
      nested: {
        alsoKeep: 'Mantener esto también',
        alsoRemove: 'Eliminar esto también'
      }
    };
    const sourceLanguage = 'en';
    const targetLanguage = 'es';

    const result = await translate(source, sourceLanguage, targetLanguage, target);

    assert.deepStrictEqual(Object.keys(result), Object.keys(source));
    assert.strictEqual(result.keep, 'Mantener esto');
    assert.strictEqual(result.nested.alsoKeep, 'Mantener esto también');
    assert.strictEqual('remove' in result, false);
    assert.strictEqual('alsoRemove' in result.nested, false);
  });
});
