import OpenAI from 'openai';
import { I18nextJson } from './i18next';

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

export async function translateKeys(
	sourceLanguage: string,
	targetLanguage: string,
	keys: I18nextJson
): Promise<I18nextJson> {
	const systemPrompt = `You are a translation assistant. Translate the given JSON object from ${sourceLanguage} to ${targetLanguage}. Maintain the original structure and do not translate any null values. Only provide the translations.`;

	try {
		const response = await openai.chat.completions.create({
			model: 'gpt-4-1106-preview',
			messages: [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: JSON.stringify(keys) }
			],
			response_format: { type: 'json_object' },
		});

		const translatedContent = response.choices[0].message.content;
		if (!translatedContent) {
			throw new Error('No translation received from OpenAI');
		}

		return JSON.parse(translatedContent) as I18nextJson;
	} catch (error) {
		console.error('Error translating keys:', error);
		throw error;
	}
}
