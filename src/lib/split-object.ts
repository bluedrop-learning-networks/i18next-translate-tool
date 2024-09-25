import { I18nextJson, I18nextJsonMergePatch } from './types';

function countProperties(obj: I18nextJsonMergePatch): number {
  let count = 0;
  for (const [, value] of Object.entries(obj)) {
    count++;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      count += countProperties(value as I18nextJson);
    }
  }
  return count;
}

export default function splitObject(obj: I18nextJsonMergePatch, maxProperties: number): I18nextJsonMergePatch[] {
  const result: I18nextJson[] = [];
  let currentObj: I18nextJson = {};
  let currentCount = 0;

  function addToCurrentObj(key: string, value: any) {
    const valuePropertyCount = typeof value === 'object' && value !== null && !Array.isArray(value)
      ? countProperties(value as I18nextJson)
      : 1;

    if (currentCount + valuePropertyCount > maxProperties) {
      if (Object.keys(currentObj).length > 0) {
        result.push(currentObj);
      }
      currentObj = {};
      currentCount = 0;
    }

    currentObj[key] = value;
    currentCount += valuePropertyCount;

    if (currentCount >= maxProperties) {
      result.push(currentObj);
      currentObj = {};
      currentCount = 0;
    }
  }

  function processObject(o: I18nextJson) {
    for (const [key, value] of Object.entries(o)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        if (countProperties(value as I18nextJson) > maxProperties) {
          const subObjects = splitObject(value as I18nextJson, maxProperties);
          subObjects.forEach((subObj, index) => {
            addToCurrentObj(`${key}_part${index + 1}`, subObj);
          });
        } else {
          addToCurrentObj(key, value);
        }
      } else {
        addToCurrentObj(key, value);
      }
    }
  }

  processObject(obj);

  if (Object.keys(currentObj).length > 0) {
    result.push(currentObj);
  }

  return result;
}
