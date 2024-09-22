import { translateKeys } from '../src/lib/openai';

export async function translate(
  source: Record<string, any>,
  sourceLanguage: string,
  targetLanguage: string,
  target?: Record<string, any>
): Promise<Record<string, any>> {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(source)) {
    if (typeof value === 'object' && value !== null) {
      result[key] = await translate(value, sourceLanguage, targetLanguage, target?.[key]);
    } else if (typeof value === 'string') {
      const translatedKeys = await translateKeys(sourceLanguage, targetLanguage, { [key]: value });
      result[key] = translatedKeys[key];
    } else {
      result[key] = value;
    }
  }

  if (target) {
    for (const [key, value] of Object.entries(target)) {
      if (key in source) {
        if (typeof value === 'string') {
          result[key] = value;
        }
      } else {
        delete result[key];
      }
    }
  }

  return result;
}

// Keep the existing functions
export function createTranslationPrompt(
	text: string,
	sourceLanguage: string,
	targetLanguage: string
): string {
	return `Translate the following text from ${sourceLanguage} to ${targetLanguage}:

"${text}"

Translated text:`;
}

export async function dummyTranslate(
	text: string,
	sourceLanguage: string,
	targetLanguage: string
): Promise<string> {
	console.log(`Translating from ${sourceLanguage} to ${targetLanguage}: "${text}"`);
	// This is a dummy implementation. Replace with actual LLM API call.
	return `[${targetLanguage}] ${text}`;
}
