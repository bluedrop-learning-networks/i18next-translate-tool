import { test } from 'node:test';
import assert from 'node:assert';
import { generateSchemaFromObject } from './json-schema';

test('generateSchemaFromObject', async (t) => {
  await t.test('should generate schema for simple object', () => {
    const input = {
      name: 'John Doe',
      age: 30,
      isStudent: false
    };
    const expected = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
        isStudent: { type: 'boolean' }
      },
      required: ['name', 'age', 'isStudent']
    };
    assert.deepStrictEqual(generateSchemaFromObject(input), expected);
  });

  await t.test('should generate schema for nested object', () => {
    const input = {
      person: {
        name: 'Jane Doe',
        address: {
          street: '123 Main St',
          city: 'Anytown'
        }
      },
      hobbies: ['reading', 'cycling']
    };
    const expected = {
      type: 'object',
      properties: {
        person: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            address: {
              type: 'object',
              properties: {
                street: { type: 'string' },
                city: { type: 'string' }
              },
              required: ['street', 'city']
            }
          },
          required: ['name', 'address']
        },
        hobbies: {
          type: 'array',
          items: { type: 'string' }
        }
      },
      required: ['person', 'hobbies']
    };
    assert.deepStrictEqual(generateSchemaFromObject(input), expected);
  });

  await t.test('should handle arrays with mixed types', () => {
    const input = {
      mixedArray: [1, 'two', true, { key: 'value' }]
    };
    const expected = {
      type: 'object',
      properties: {
        mixedArray: {
          type: 'array',
          items: {
            oneOf: [
              { type: 'number' },
              { type: 'string' },
              { type: 'boolean' },
              {
                type: 'object',
                properties: {
                  key: { type: 'string' }
                },
                required: ['key']
              }
            ]
          }
        }
      },
      required: ['mixedArray']
    };
    assert.deepStrictEqual(generateSchemaFromObject(input), expected);
  });

  await t.test('should handle null values', () => {
    const input = {
      nullValue: null,
      nonNullValue: 'test'
    };
    const expected = {
      type: 'object',
      properties: {
        nullValue: { type: 'null' },
        nonNullValue: { type: 'string' }
      },
      required: ['nullValue', 'nonNullValue']
    };
    assert.deepStrictEqual(generateSchemaFromObject(input), expected);
  });
});
