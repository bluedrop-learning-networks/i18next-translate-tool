import { I18nextJson, I18nextJsonMergePatch } from './types';

export default function jsonMergePatch(
	target: I18nextJson,
	patch: I18nextJsonMergePatch
): I18nextJson {
	const result: I18nextJson = { ...target };

	for (const [key, value] of Object.entries(patch)) {
		if (value === null) {
			delete result[key];
		} else if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
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
