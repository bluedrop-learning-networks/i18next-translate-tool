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
  const result: I18nextJsonMergePatch[] = [];
  let currentObj: I18nextJsonMergePatch = {};
  let currentCount = 0;

  function addToCurrentObj(path: string[], value: any) {
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

    let target = currentObj;
    for (let i = 0; i < path.length - 1; i++) {
      if (!(path[i] in target)) {
        target[path[i]] = {};
      }
      target = target[path[i]] as I18nextJsonMergePatch;
    }
    target[path[path.length - 1]] = value;
    currentCount += valuePropertyCount;

    if (currentCount >= maxProperties) {
      result.push(currentObj);
      currentObj = {};
      currentCount = 0;
    }
  }

  function processObject(o: I18nextJson, path: string[] = []) {
    for (const [key, value] of Object.entries(o)) {
      const newPath = [...path, key];
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        if (countProperties(value as I18nextJson) > maxProperties) {
          const subObjects = splitObject(value as I18nextJson, maxProperties);
          subObjects.forEach((subObj, index) => {
            addToCurrentObj([...newPath, `part${index + 1}`], subObj);
          });
        } else {
          processObject(value as I18nextJson, newPath);
        }
      } else {
        addToCurrentObj(newPath, value);
      }
    }
  }

  processObject(obj);

  if (Object.keys(currentObj).length > 0) {
    result.push(currentObj);
  }

  return result;
}
