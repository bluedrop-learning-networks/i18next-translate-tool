import OpenAI from 'openai';
import { I18nextJson } from './i18next';

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

function countProperties(obj: I18nextJson): number {
  let count = 0;
  for (const [, value] of Object.entries(obj)) {
    count++;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      count += countProperties(value as I18nextJson);
    }
  }
  return count;
}

function splitObject(obj: I18nextJson, maxProperties: number = 100): I18nextJson[] {
  const result: I18nextJson[] = [];
  let currentObj: I18nextJson = {};
  let currentCount = 0;

  function addToCurrentObj(key: string, value: any) {
    currentObj[key] = value;
    currentCount++;
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

function generateSchema(obj: I18nextJson): any {
  const schema: any = {
    type: 'object',
    properties: {},
    required: [],
    additionalProperties: false
  };

  for (const [key, value] of Object.entries(obj)) {
    schema.required.push(key);
    if (value === null) {
      schema.properties[key] = { type: 'null' };
    } else if (typeof value === 'string') {
      schema.properties[key] = { type: 'string' };
    } else if (Array.isArray(value)) {
      schema.properties[key] = {
        type: 'array',
        items: { type: 'string' }
      };
    } else if (typeof value === 'object') {
      schema.properties[key] = generateSchema(value as I18nextJson);
    }
  }

  return schema;
}

async function translateChunk(
  sourceLanguage: string,
  targetLanguage: string,
  chunk: I18nextJson
): Promise<I18nextJson> {
  const systemPrompt = `You are a translation assistant. Translate the given JSON object from '${sourceLanguage}' to '${targetLanguage}'. Maintain the original structure and do not translate any null values. Only provide the translations.`;

  const schema = generateSchema(chunk);

  try {
    const response = await openai.beta.chat.completions.parse({
      model: 'gpt-4o-2024-08-06',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(chunk) }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "translation",
          strict: true,
          schema,
        }
      },
    });

    return response.choices[0].message.parsed as unknown as I18nextJson;
  } catch (error) {
    console.error('Error translating chunk:', error);
    throw error;
  }
}

export async function translateKeys(
  sourceLanguage: string,
  targetLanguage: string,
  keys: I18nextJson
): Promise<I18nextJson> {
  const chunks = splitObject(keys);
  const translatedChunks = await Promise.all(
    chunks.map(chunk => translateChunk(sourceLanguage, targetLanguage, chunk))
  );

  // Merge translated chunks back into a single object
  return translatedChunks.reduce((acc, chunk) => ({ ...acc, ...chunk }), {});
}
