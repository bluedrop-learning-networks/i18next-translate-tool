import OpenAI from 'openai';

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

import { I18nextJson } from './i18next';

export async function translateKeys(
	sourceLanguage: string,
	targetLanguage: string,
	keys: I18nextJson
): Promise<I18nextJson> {
	const prompt = `Translate the following nested object from ${sourceLanguage} to ${targetLanguage}. Do not translate any null values, leave them as null. Only provide the translations, maintaining the original structure:

${JSON.stringify(keys, null, 2)}`;

  console.log(prompt);

	try {
		const response = await openai.chat.completions.create({
			model: 'gpt-4',
			messages: [{ role: 'user', content: prompt }],
		});

		const translatedContent = response.choices[0].message.content;
		if (!translatedContent) {
			throw new Error('No translation received from OpenAI');
		}

		return JSON.parse(translatedContent);
	} catch (error) {
		console.error('Error translating keys:', error);
		throw error;
	}
}
