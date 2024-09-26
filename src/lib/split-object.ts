import { I18nextJson, I18nextJsonMergePatch } from './types.js';

export function countProperties(obj: I18nextJsonMergePatch): number {
	let count = 0;
	for (const [, value] of Object.entries(obj)) {
		count++;
		if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
			count += countProperties(value as I18nextJson);
		}
	}
	return count;
}

export function splitObject(
	obj: I18nextJsonMergePatch,
	maxProperties: number
): I18nextJsonMergePatch[] {
	const result: I18nextJsonMergePatch[] = [];
	let currentObj: I18nextJsonMergePatch = {};
	let currentCount = 0;

	function addToCurrentObj(path: string[], value: any) {
		let target = currentObj;
		for (let i = 0; i < path.length - 1; i++) {
			if (!(path[i] in target)) {
				target[path[i]] = {};
				currentCount++;
			}
			target = target[path[i]] as I18nextJsonMergePatch;
		}
		target[path[path.length - 1]] = value;
		currentCount++;

		if (currentCount >= maxProperties) {
			result.push(currentObj);
			currentObj = {};
			currentCount = 0;
		}
	}

	function processObject(o: I18nextJsonMergePatch, path: string[] = []) {
		for (const [key, value] of Object.entries(o)) {
			const newPath = [...path, key];
			if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
				addToCurrentObj(newPath, {});
				processObject(value as I18nextJson, newPath);
			} else {
				addToCurrentObj(newPath, value);
			}
		}
	}

	processObject(obj);

	if (Object.keys(currentObj).length > 0) {
		result.push(currentObj);
	}

	return result;
}
