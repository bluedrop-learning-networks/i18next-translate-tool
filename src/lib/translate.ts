import { extractUntranslatedDiff } from './i18next';
import { I18nextJson, I18nextJsonMergePatch } from './types';
import { splitObject } from './split-object';
import { jsonMergePatch } from './json-merge-patch';

import OpenAI from 'openai';
import { generateSchemaFromObject } from './json-schema';

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

async function translateI18nextJsonChunk({
	sourceLanguage,
	targetLanguage,
	json,
}: {
	sourceLanguage: string;
	targetLanguage: string;
	json: I18nextJsonMergePatch;
}) {
	const systemPrompt = `
	  You are a translation assistant. Translate the given i18next JSON object from '${sourceLanguage}' to '${targetLanguage}'.
		Do not translate interpolation placeholders - text between double curly braces, eg {{dynamicValue}}.
		Do not translate nested keys - text between $t() parentheses, eg $t(nested).
		Maintain the original structure and do not translate any null values.
		Only provide the translations.
	`;

	const schema = generateSchemaFromObject(json);

	try {
		const response = await openai.beta.chat.completions.parse({
			model: 'gpt-4o-2024-08-06',
			messages: [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: JSON.stringify(json) },
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

		return response.choices[0].message.parsed as unknown as I18nextJsonMergePatch;
	} catch (error) {
		console.error('Error translating chunk:', error);
		throw error;
	}
}

export async function translateI18nextJson({
	source,
	sourceLanguage,
	targetLanguage,
	target = {},
}: { source: I18nextJson; sourceLanguage: string; targetLanguage: string; target?: I18nextJson }) {
	// Identify untranslated strings
	const untranslatedStrings = extractUntranslatedDiff({ source, target });

	// split into chunks of 100 properties or less
	const chunks = splitObject(untranslatedStrings, 100);

	const translatedChunks = await Promise.all(
		chunks.map((chunk) =>
			translateI18nextJsonChunk({ sourceLanguage, targetLanguage, json: chunk })
		)
	);

	// Merge translated strings back into target
	return translatedChunks.reduce((acc, chunk) => jsonMergePatch(acc, chunk), target);
}

// add test
export async function translateText({
	sourceLanguage,
	targetLanguage,
	text,
}: {
	sourceLanguage: string;
	targetLanguage: string;
	text: string;
}) {
	// care for interpolation in the prompt
	const systemPrompt = `
	  You are a translation assistant. Translate all of the given text from '${sourceLanguage}' to '${targetLanguage}'.
		Only provide the translation and nothing else. If the given text contains html/xml markup, leave it intact and do
		not translate the tags.`;

	const schema = {
		properties: {
			translation: {
				type: 'string',
			},
		},
		additionalProperties: false,
		required: ['translation'],
	};

	try {
		const response = await openai.beta.chat.completions.parse({
			model: 'gpt-4o-2024-08-06',
			messages: [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: text },
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

		return response.choices[0].message.parsed as unknown;
	} catch (error) {
		console.error('Error translating chunk:', error);
		throw error;
	}
}
