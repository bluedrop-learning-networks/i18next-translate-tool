import { describe, it } from 'node:test';
import assert from 'node:assert';
import deepMerge from './deep-merge';

describe('deepMerge', () => {
  it('should merge two simple objects', () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { b: 3, c: 4 };
    const result = deepMerge(obj1, obj2);
    assert.deepStrictEqual(result, { a: 1, b: 3, c: 4 });
  });

  it('should handle nested objects', () => {
    const obj1 = { a: { x: 1, y: 2 }, b: 3 };
    const obj2 = { a: { y: 3, z: 4 }, c: 5 };
    const result = deepMerge(obj1, obj2);
    assert.deepStrictEqual(result, { a: { x: 1, y: 3, z: 4 }, b: 3, c: 5 });
  });

  it('should handle arrays', () => {
    const obj1 = { a: [1, 2], b: 3 };
    const obj2 = { a: [3, 4], c: 5 };
    const result = deepMerge(obj1, obj2);
    assert.deepStrictEqual(result, { a: [3, 4], b: 3, c: 5 });
  });

  it('should handle null and undefined values', () => {
    const obj1 = { a: null, b: undefined, c: 1 };
    const obj2 = { a: 2, b: 3, d: null };
    const result = deepMerge(obj1, obj2);
    assert.deepStrictEqual(result, { a: 2, b: 3, c: 1, d: null });
  });

  it('should merge multiple objects', () => {
    const obj1 = { a: 1, b: { x: 10 } };
    const obj2 = { b: { y: 20 }, c: 3 };
    const obj3 = { a: 4, b: { z: 30 }, d: 5 };
    const result = deepMerge(obj1, obj2, obj3);
    assert.deepStrictEqual(result, { a: 4, b: { x: 10, y: 20, z: 30 }, c: 3, d: 5 });
  });
});
