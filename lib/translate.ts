import type { I18NextJson } from './i18next';

type TranslationFunction = (
	text: string,
	sourceLanguage: string,
	targetLanguage: string
) => Promise<string>;

export async function translateI18NextJson(
	sourceJson: I18NextJson,
	sourceLanguage: string,
	targetLanguage: string,
	translateFn: TranslationFunction
): Promise<I18NextJson> {
	const targetJson: I18NextJson = {};

	for (const [key, value] of Object.entries(sourceJson)) {
		if (typeof value === 'string') {
			targetJson[key] = await translateFn(value, sourceLanguage, targetLanguage);
		} else if (typeof value === 'object' && value !== null) {
			targetJson[key] = await translateI18NextJson(
				value,
				sourceLanguage,
				targetLanguage,
				translateFn
			);
		} else {
			targetJson[key] = value;
		}
	}

	return targetJson;
}

export function createTranslationPrompt(
	text: string,
	sourceLanguage: string,
	targetLanguage: string
): string {
	return `Translate the following text from ${sourceLanguage} to ${targetLanguage}:

"${text}"

Translated text:`;
}

// Example LLM translation function (to be replaced with actual implementation)
export async function dummyTranslate(
	text: string,
	sourceLanguage: string,
	targetLanguage: string
): Promise<string> {
	console.log(`Translating from ${sourceLanguage} to ${targetLanguage}: "${text}"`);
	// This is a dummy implementation. Replace with actual LLM API call.
	return `[${targetLanguage}] ${text}`;
}
