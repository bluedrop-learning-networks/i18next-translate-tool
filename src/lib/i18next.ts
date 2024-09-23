import { promises as fs } from 'node:fs';

interface I18nextJson {
	[key: string]: string | string[] | I18nextJson;
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

export function identifyUntranslatedStrings(
	source: I18nextJson,
	target: I18nextJson
): I18nextJson {
	const patch: I18nextJson = {};

	function generatePatch(sourceObj: I18nextJson, targetObj: I18nextJson, result: I18nextJson) {
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
