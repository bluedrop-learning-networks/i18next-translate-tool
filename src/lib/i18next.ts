import { promises as fs } from 'node:fs';

interface I18nextJson {
	[key: string]: string | I18nextJson;
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
		const jsonString = JSON.stringify(data, null, 2);
		await fs.writeFile(filePath, jsonString, 'utf8');
		return filePath;
	} catch (error) {
		console.error(`Error writing file ${filePath}:`, error);
		throw error;
	}
}

// TODO: only care about empty strings, no need to identify missing
// TODO: deal with arrays of values
export function identifyUntranslatedStrings(
	source: I18nextJson,
	target: I18nextJson
): I18nextJson {
	const untranslated: I18nextJson = {};

	function traverse(sourceObj: I18nextJson, targetObj: I18nextJson, result: I18nextJson) {
		for (const [key, sourceValue] of Object.entries(sourceObj)) {
			if (typeof sourceValue === 'string') {
				if (!(key in targetObj) || typeof targetObj[key] !== 'string' || targetObj[key].trim() === '') {
					result[key] = sourceValue;
				}
			} else if (typeof sourceValue === 'object' && sourceValue !== null) {
				if (typeof targetObj[key] !== 'object' || targetObj[key] === null) {
					result[key] = {};
					traverse(sourceValue, {}, result[key] as I18nextJson);
				} else {
					result[key] = {};
					traverse(sourceValue, targetObj[key] as I18nextJson, result[key] as I18nextJson);
				}
			}
		}
	}

	traverse(source, target, untranslated);
	return untranslated;
}

// TODO: deal with arrays of values
export function synchronizeI18nextJson(source: I18nextJson, target: I18nextJson): I18nextJson {
	const synchronized: I18nextJson = {};

	function synchronize(src: I18nextJson, tgt: I18nextJson, result: I18nextJson) {
		for (const [key, value] of Object.entries(src)) {
			if (typeof value === 'object' && value !== null) {
				result[key] = {};
				synchronize(value, (tgt[key] as I18nextJson) || {}, result[key] as I18nextJson);
			} else {
				result[key] = key in tgt ? tgt[key] : '';
			}
		}
	}

	synchronize(source, target, synchronized);
	return synchronized;
}
