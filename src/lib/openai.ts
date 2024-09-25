import OpenAI from 'openai';
import { I18nextJson, I18nextJsonMergePatch } from './types';
import { generateSchemaFromObject } from './json-schema';

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

export async function translateChunk(
	sourceLanguage: string,
	targetLanguage: string,
	chunk: I18nextJsonMergePatch
): Promise<I18nextJson> {
	const systemPrompt = `You are a translation assistant. Translate the given JSON object from '${sourceLanguage}' to '${targetLanguage}'. Maintain the original structure and do not translate any null values. Only provide the translations.`;

	const schema = generateSchemaFromObject(chunk);

	try {
		const response = await openai.beta.chat.completions.parse({
			model: 'gpt-4o-2024-08-06',
			messages: [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: JSON.stringify(chunk) },
			],
			response_format: {
				type: 'json_schema',
				json_schema: {
					name: 'translation',
					strict: true,
					schema,
				},
			},
		});

		return response.choices[0].message.parsed as unknown as I18nextJson;
	} catch (error) {
		console.error('Error translating chunk:', error);
		throw error;
	}
}
