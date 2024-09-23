import OpenAI from 'openai';

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

export async function translateKeys(
	sourceLanguage: string,
	targetLanguage: string,
	keys: Record<string, string>
): Promise<Record<string, string>> {
	const prompt = `Translate the following keys from ${sourceLanguage} to ${targetLanguage}. Only provide the translations, maintaining the original structure:

${JSON.stringify(keys, null, 2)}`;

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
