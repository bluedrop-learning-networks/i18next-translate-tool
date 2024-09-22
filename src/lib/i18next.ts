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

export function identifyUntranslatedStrings(source: I18nextJson, target: I18nextJson): Record<string, string[]> {
  const untranslated: Record<string, string[]> = {};

  function traverse(sourceObj: I18nextJson, targetObj: I18nextJson, path: string[] = []) {
    for (const [key, sourceValue] of Object.entries(sourceObj)) {
      const currentPath = [...path, key];
      const targetValue = targetObj[key];

      if (typeof sourceValue === 'string') {
        if (!(key in targetObj) || typeof targetValue !== 'string' || targetValue.trim() === '') {
          untranslated[sourceValue] = currentPath;
        }
      } else if (typeof sourceValue === 'object' && sourceValue !== null) {
        if (typeof targetValue !== 'object' || targetValue === null) {
          traverse(sourceValue, {}, currentPath);
        } else {
          traverse(sourceValue, targetValue, currentPath);
        }
      }
    }
  }

  traverse(source, target);
  return untranslated;
}

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
