import { I18nextJson, I18nextJsonMergePatch } from './types.js';

export function jsonMergePatch(target: I18nextJson, patch: I18nextJsonMergePatch): I18nextJson {
	const result: I18nextJson = { ...target };

	for (const [key, value] of Object.entries(patch)) {
		if (value === undefined) {
			continue; // Skip undefined values
		} else if (value === null) {
			delete result[key];
		} else if (typeof value === 'object' && !Array.isArray(value)) {
			if (typeof result[key] === 'object' && !Array.isArray(result[key]) && result[key] !== null) {
				result[key] = jsonMergePatch(result[key] as I18nextJson, value as I18nextJson);
			} else {
				result[key] = jsonMergePatch({}, value as I18nextJson);
			}
		} else {
			result[key] = value;
		}
	}

	return result;
}
