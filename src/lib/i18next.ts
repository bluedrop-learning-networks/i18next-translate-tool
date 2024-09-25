import { promises as fs } from 'node:fs';
import { I18nextJson, I18nextJsonMergePatch } from './types';

export async function readI18nextJson({ filePath }: { filePath: string }): Promise<I18nextJson> {
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

export async function writeI18nextJson({
	filePath,
	data,
}: { filePath: string; data: I18nextJson }): Promise<string> {
	try {
		const jsonString =
			JSON.stringify(
				data,
				(key, value) => {
					if (value && typeof value === 'object' && !Array.isArray(value)) {
						return Object.keys(value)
							.sort()
							.reduce((sorted, key) => {
								sorted[key] = value[key];
								return sorted;
							}, {});
					}
					return value;
				},
				2
			) + '\n';
		await fs.writeFile(filePath, jsonString, 'utf8');
		return filePath;
	} catch (error) {
		console.error(`Error writing file ${filePath}:`, error);
		throw error;
	}
}

// extract untranslated diff
export function extractUntranslatedDiff({
	source,
	target,
}: { source: I18nextJson; target: I18nextJson }): I18nextJsonMergePatch {
	const result: I18nextJsonMergePatch = {};

	function diff(sourceObj: I18nextJson, targetObj: I18nextJson): I18nextJsonMergePatch {
		const patch: I18nextJsonMergePatch = {};

		for (const [key, sourceValue] of Object.entries(sourceObj)) {
			if (!(key in targetObj)) {
				patch[key] = sourceValue;
			} else if (typeof sourceValue === 'string' && typeof targetObj[key] === 'string') {
				if (targetObj[key] === '') {
					patch[key] = sourceValue;
				}
			} else if (Array.isArray(sourceValue) && Array.isArray(targetObj[key])) {
				const untranslatedArray = sourceValue.filter(
					(_, index) => (targetObj[key] as string[])[index] === ''
				);
				if (untranslatedArray.length > 0) {
					patch[key] = sourceValue;
				}
			} else if (
				typeof sourceValue === 'object' &&
				sourceValue !== null &&
				typeof targetObj[key] === 'object' &&
				targetObj[key] !== null &&
				!Array.isArray(sourceValue) &&
				!Array.isArray(targetObj[key])
			) {
				const nestedPatch = diff(sourceValue as I18nextJson, targetObj[key] as I18nextJson);
				if (Object.keys(nestedPatch).length > 0) {
					patch[key] = nestedPatch;
				}
			}
		}

		for (const key of Object.keys(targetObj)) {
			if (!(key in sourceObj)) {
				patch[key] = null;
			}
		}

		return patch;
	}

	return diff(source, target);
}
