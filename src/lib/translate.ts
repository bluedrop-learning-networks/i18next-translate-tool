import { translateChunk } from './openai';
import { extractUntranslatedDiff } from './i18next';
import { I18nextJson } from './types';
import splitObject from './split-object';
import jsonMergePatch from './json-merge-patch';

export async function translate({
	source,
	sourceLanguage,
	targetLanguage,
	target = {},
}: { source: I18nextJson; sourceLanguage: string; targetLanguage: string; target?: I18nextJson }) {
	// Identify untranslated strings
	const untranslatedStrings = extractUntranslatedDiff({ source, target });

	// split into chunks of 100 properties or less
	const chunks = splitObject(untranslatedStrings, 100);

	const translatedChunks = await Promise.all(
		chunks.map((chunk) => translateChunk(sourceLanguage, targetLanguage, chunk))
	);

	// Merge translated strings back into target
	return translatedChunks.reduce((acc, chunk) => jsonMergePatch(acc, chunk), target);
}
