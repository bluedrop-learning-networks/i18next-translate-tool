import { translateKeys } from './openai';
import { synchronizeI18nextJson, identifyUntranslatedStrings } from './i18next';

export async function translate(
  source: Record<string, any>,
  sourceLanguage: string,
  targetLanguage: string,
  target?: Record<string, any>
): Promise<Record<string, any>> {
  // Synchronize the target with the source structure
  const synchronizedTarget = target ? synchronizeI18nextJson(source, target) : {};

  // Identify untranslated strings
  const untranslatedStrings = identifyUntranslatedStrings(source, synchronizedTarget);

  // Prepare strings for translation
  const toTranslate: Record<string, string> = {};
  for (const [sourceString, paths] of Object.entries(untranslatedStrings)) {
    toTranslate[paths.join('.')] = sourceString;
  }

  // Translate all collected strings
  const translatedStrings = await translateKeys(sourceLanguage, targetLanguage, toTranslate);

  // Merge translated strings back into the synchronized structure
  const result = JSON.parse(JSON.stringify(synchronizedTarget));
  for (const [path, translation] of Object.entries(translatedStrings)) {
    const keys = path.split('.');
    let current = result;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = translation;
  }

  return result;
}
