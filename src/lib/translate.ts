import { translateKeys } from './openai';
import { synchronizeI18nextJson, identifyUntranslatedStrings, I18nextJson } from './i18next';

export async function translate(
  source: I18nextJson,
  sourceLanguage: string,
  targetLanguage: string,
  target?: I18nextJson
): Promise<I18nextJson> {
  // Synchronize the target with the source structure
  const synchronizedTarget = target ? synchronizeI18nextJson(source, target) : {};

  // Identify untranslated strings
  const untranslatedStrings = identifyUntranslatedStrings(source, synchronizedTarget);

  // Translate all collected strings
  const translatedStrings = await translateKeys(sourceLanguage, targetLanguage, untranslatedStrings);

  // Merge translated strings back into the synchronized structure
  const result = JSON.parse(JSON.stringify(synchronizedTarget));
  mergeTranslations(result, translatedStrings);

  return result;
}

function mergeTranslations(target: I18nextJson, source: I18nextJson) {
  for (const [key, value] of Object.entries(source)) {
    if (typeof value === 'string') {
      target[key] = value;
    } else if (typeof value === 'object' && value !== null) {
      if (!(key in target) || typeof target[key] !== 'object') {
        target[key] = {};
      }
      mergeTranslations(target[key] as I18nextJson, value);
    }
  }
}
