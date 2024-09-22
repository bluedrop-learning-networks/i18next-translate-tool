import fs from 'fs/promises';

interface I18nextJson {
  [key: string]: string | I18nextJson;
}

export async function readI18nextJson(filePath: string): Promise<I18nextJson> {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data) as I18nextJson;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return {};
  }
}

export async function writeI18nextJson(filePath: string, data: I18nextJson): Promise<void> {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
  }
}

export function identifyUntranslatedStrings(json: I18nextJson): string[] {
  const untranslated: string[] = [];

  function traverse(obj: I18nextJson, prefix: string = '') {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'string' && value.trim() === '') {
        untranslated.push(fullKey);
      } else if (typeof value === 'object' && value !== null) {
        traverse(value, fullKey);
      }
    }
  }

  traverse(json);
  return untranslated;
}

export function mergeI18nextJson(source: I18nextJson, target: I18nextJson): I18nextJson {
  const merged: I18nextJson = { ...target };

  function merge(src: I18nextJson, tgt: I18nextJson) {
    for (const [key, value] of Object.entries(src)) {
      if (typeof value === 'object' && value !== null) {
        if (typeof tgt[key] !== 'object') {
          tgt[key] = {};
        }
        merge(value, tgt[key] as I18nextJson);
      } else if (!(key in tgt) || (tgt[key] as string).trim() === '') {
        tgt[key] = value;
      }
    }
  }

  merge(source, merged);
  return merged;
}
