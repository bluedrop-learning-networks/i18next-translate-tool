import { test } from 'node:test';
import assert from 'node:assert';
import { generateSchemaFromObject } from './json-schema';

test('generateSchemaFromObject', async (t) => {
  await t.test('should generate schema for object with string and null values', () => {
    const input = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: null
    };
    const expected = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'null' }
      },
      required: ['name', 'email', 'phone'],
      additionalProperties: false,
    };
    assert.deepStrictEqual(generateSchemaFromObject(input), expected);
  });

  await t.test('should generate schema for nested object with string and null values', () => {
    const input = {
      person: {
        name: 'Jane Doe',
        address: {
          street: '123 Main St',
          city: 'Anytown',
          country: null
        }
      },
      company: null
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
                city: { type: 'string' },
                country: { type: 'null' }
              },
              required: ['street', 'city', 'country'],
              additionalProperties: false,
            }
          },
          required: ['name', 'address'],
          additionalProperties: false,
        },
        company: { type: 'null' },
      },
      required: ['person', 'company'],
      additionalProperties: false,
    };
    assert.deepStrictEqual(generateSchemaFromObject(input), expected);
  });

  await t.test('should handle empty objects', () => {
    const input = {};
    const expected = {
      type: 'object',
      properties: {},
      additionalProperties: false,
      required: [],
    };
    assert.deepStrictEqual(generateSchemaFromObject(input), expected);
  });

  await t.test('should handle objects with only null values', () => {
    const input = {
      field1: null,
      field2: null
    };
    const expected = {
      type: 'object',
      properties: {
        field1: { type: 'null' },
        field2: { type: 'null' }
      },
      additionalProperties: false,
      required: ['field1', 'field2']
    };
    assert.deepStrictEqual(generateSchemaFromObject(input), expected);
  });
});
