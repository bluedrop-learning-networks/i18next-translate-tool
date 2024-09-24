import { translateKeys } from './openai';
import { synchronizeI18nextJson, identifyUntranslatedStrings, I18nextJson, applyJsonMergePatch } from './i18next';

export async function translate(
  source: I18nextJson,
  sourceLanguage: string,
  targetLanguage: string,
  target: I18nextJson = {}
) {
  // Identify untranslated strings
  const untranslatedStrings = identifyUntranslatedStrings(source, target);

  console.log(untranslatedStrings);

  // Translate all collected strings
  const translatedStrings = await translateKeys(sourceLanguage, targetLanguage, untranslatedStrings);

  // Merge translated strings back into target
  return applyJsonMergePatch(target, translatedStrings);
}
