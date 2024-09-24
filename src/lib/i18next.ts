import { promises as fs } from 'node:fs';

export interface I18nextJson {
	[key: string]: string | string[] | I18nextJson;
}

interface I18nextJsonMergePatch {
	[key: string]: string | string[] | null | I18nextJsonMergePatch;
}

export async function readI18nextJson(filePath: string): Promise<I18nextJson> {
	try {
		const data = await fs.readFile(filePath, 'utf8');
		return JSON.parse(data) as I18nextJson;
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
			console.warn(`File not found: ${filePath}`);
		} else {
			console.error(`Error reading file ${filePath}:`, error);
		}
		return {};
	}
}

export async function writeI18nextJson(filePath: string, data: I18nextJson): Promise<string> {
	try {
		const jsonString = JSON.stringify(data, (key, value) => {
			if (value && typeof value === 'object' && !Array.isArray(value)) {
				return Object.keys(value).sort().reduce((sorted, key) => {
					sorted[key] = value[key];
					return sorted;
				}, {});
			}
			return value;
		}, 2) + '\n';
		await fs.writeFile(filePath, jsonString, 'utf8');
		return filePath;
	} catch (error) {
		console.error(`Error writing file ${filePath}:`, error);
		throw error;
	}
}

// The sortObjectKeys function is no longer needed and can be removed

export function identifyUntranslatedStrings(
	source: I18nextJson,
	target: I18nextJson
) {
	const patch: I18nextJsonMergePatch = {};

	function generatePatch(sourceObj: I18nextJson, targetObj: I18nextJson, result: I18nextJsonMergePatch) {
		for (const [key, sourceValue] of Object.entries(sourceObj)) {
			if (!(key in targetObj) ||
				(typeof targetObj[key] === 'string' && targetObj[key] === '') ||
				(Array.isArray(sourceValue) && Array.isArray(targetObj[key]) &&
				 (targetObj[key] as string[]).some((item, index) => item === '' && (sourceValue as string[])[index] !== ''))) {
				result[key] = sourceValue;
			} else if (typeof sourceValue === 'object' && sourceValue !== null &&
						typeof targetObj[key] === 'object' && targetObj[key] !== null &&
						!Array.isArray(sourceValue) && !Array.isArray(targetObj[key])) {
				result[key] = {};
				generatePatch(sourceValue as I18nextJson, targetObj[key] as I18nextJson, result[key] as I18nextJson);
				if (Object.keys(result[key] as I18nextJson).length === 0) {
					delete result[key];
				}
			}
		}

		for (const key of Object.keys(targetObj)) {
			if (!(key in sourceObj)) {
				result[key] = null;
			}
		}
	}

	generatePatch(source, target, patch);
	return patch;
}

export function synchronizeI18nextJson(source: I18nextJson, target: I18nextJson): I18nextJson {
	const synchronized: I18nextJson = {};

	function synchronize(src: I18nextJson, tgt: I18nextJson, result: I18nextJson) {
		for (const [key, value] of Object.entries(src)) {
			if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
				result[key] = {};
				synchronize(value as I18nextJson, (tgt[key] as I18nextJson) || {}, result[key] as I18nextJson);
			} else if (Array.isArray(value)) {
				result[key] = key in tgt && Array.isArray(tgt[key]) ? tgt[key] : value.map(() => '');
			} else {
				result[key] = key in tgt ? tgt[key] : '';
			}
		}
	}

	synchronize(source, target, synchronized);
	return synchronized;
}

export function applyJsonMergePatch(target: I18nextJson, patch: I18nextJsonMergePatch): I18nextJson {
	const result: I18nextJson = { ...target };

	for (const [key, value] of Object.entries(patch)) {
		if (value === null) {
			delete result[key];
		} else if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
			if (typeof result[key] === 'object' && !Array.isArray(result[key]) && result[key] !== null) {
				result[key] = applyJsonMergePatch(result[key] as I18nextJson, value as I18nextJson);
			} else {
				result[key] = applyJsonMergePatch({}, value as I18nextJson);
			}
		} else {
			result[key] = value;
		}
	}

	return result;
}
