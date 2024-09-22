import { translateKeys } from './openai';
import { synchronizeI18nextJson } from './i18next';

export async function translate(
  source: Record<string, any>,
  sourceLanguage: string,
  targetLanguage: string,
  target?: Record<string, any>
): Promise<Record<string, any>> {
  // Synchronize the target with the source structure
  const synchronizedTarget = target ? synchronizeI18nextJson(source, target) : {};

  // Collect all string values that need translation
  const toTranslate: Record<string, string> = {};
  const collectStrings = (obj: Record<string, any>, path: string[] = []) => {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        const fullPath = [...path, key].join('.');
        if (!target || !synchronizedTarget[fullPath]) {
          toTranslate[fullPath] = value;
        }
      } else if (typeof value === 'object' && value !== null) {
        collectStrings(value, [...path, key]);
      }
    }
  };
  collectStrings(source);

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
