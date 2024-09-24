import OpenAI from 'openai';
import { I18nextJson } from './i18next';

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});


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

export async function translateKeys(
	sourceLanguage: string,
	targetLanguage: string,
	keys: I18nextJson
): Promise<I18nextJson> {
	const systemPrompt = `You are a translation assistant. Translate the given JSON object from '${sourceLanguage}' to '${targetLanguage}'. Maintain the original structure and do not translate any null values. Only provide the translations.`;

	const schema = generateSchema(keys);

	try {
		const response = await openai.chat.completions.create({
			model: 'gpt-4',
			messages: [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: JSON.stringify(keys) }
			],
			functions: [
				{
					name: 'translate',
					description: 'Translate the given JSON object',
					parameters: schema
				}
			],
			function_call: { name: 'translate' }
		});

		const functionCall = response.choices[0].message.function_call;
		if (!functionCall || !functionCall.arguments) {
			throw new Error('No translation received from OpenAI');
		}
		const translatedContent = JSON.parse(functionCall.arguments) as I18nextJson;
		return translatedContent;
	} catch (error) {
		console.error('Error translating keys:', error);
		throw error;
	}
}
