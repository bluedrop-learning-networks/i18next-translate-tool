import { describe, it } from 'node:test';
import assert from 'node:assert';
import jsonMergePatch from './json-merge-patch';

describe('deepMerge', () => {
	it('should merge two simple objects', () => {
		const obj1 = { a: 1, b: 2 };
		const obj2 = { b: 3, c: 4 };
		const result = jsonMergePatch(obj1, obj2);
		assert.deepStrictEqual(result, { a: 1, b: 3, c: 4 });
	});

	it('should handle nested objects', () => {
		const obj1 = { a: { x: 1, y: 2 }, b: 3 };
		const obj2 = { a: { y: 3, z: 4 }, c: 5 };
		const result = jsonMergePatch(obj1, obj2);
		assert.deepStrictEqual(result, { a: { x: 1, y: 3, z: 4 }, b: 3, c: 5 });
	});

	it('should handle arrays', () => {
		const obj1 = { a: [1, 2], b: 3 };
		const obj2 = { a: [3, 4], c: 5 };
		const result = jsonMergePatch(obj1, obj2);
		assert.deepStrictEqual(result, { a: [3, 4], b: 3, c: 5 });
	});

	it('should handle null and undefined values', () => {
		const obj1 = { a: null, b: undefined, c: 1 };
		const obj2 = { a: 2, b: 3, d: null };
		const result = jsonMergePatch(obj1, obj2);
		assert.deepStrictEqual(result, { a: 2, b: 3, c: 1, d: null });
	});
});
