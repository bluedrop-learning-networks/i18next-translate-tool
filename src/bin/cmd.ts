import { command, flag, string, option, multioption, array, boolean } from 'cmd-ts';
import { readI18nextJson, writeI18nextJson, translateI18nextJson } from '../index.js';
import { glob } from 'glob';
import path from 'path';

export const i18nextTranslate = command({
	name: 'i18next-translate',
	description: 'Translate i18next JSON files',
	args: {
		sourcePattern: option({
			type: string,
			long: 'source',
			short: 's',
			description: 'Glob pattern for source language file(s)',
		}),
		sourceLanguage: option({
			type: string,
			long: 'source-lang',
			description: 'Source language code (default: en)',
			defaultValue: () => 'en',
		}),
		targetLanguages: multioption({
			type: array(string),
			long: 'target',
			short: 't',
			description: 'Target language code(s)',
		}),
		outputPattern: option({
			type: string,
			long: 'output',
			short: 'o',
			description: 'Output file pattern (e.g., "locales/<lang>.json")',
		}),
		replaceAll: flag({
			type: boolean,
			long: 'replace-all',
			description: 'Replace all existing translations instead of only updating missing ones',
			defaultValue: () => false,
		}),
	},
	handler: async ({
		sourcePattern,
		sourceLanguage,
		targetLanguages,
		outputPattern,
		replaceAll,
	}) => {
		try {
			console.log('Starting translation process');
			const sourceFiles = glob.sync(sourcePattern);

			if (sourceFiles.length === 0) {
				console.error(`No files found matching pattern: ${sourcePattern}`);
				return;
			}

			for (const sourceFile of sourceFiles) {
				console.log(`Processing source file: ${sourceFile}`);
				const sourceJson = await readI18nextJson({ filePath: sourceFile });
				const sourceDir = path.dirname(sourceFile);

				// log out number of strings to translate
				// log out total number of tokens used + total cost
				// test result to ensure that keys are the same as source
				// compare keys and values between source and target (report on % same, missing, additional, etc.)
				// throw an error if OPENAI_API_KEY not set
				// add verbose mode to control log output?
				// at least one target language must be provided
				// write test for CLI
				// write README
				for (const targetLang of targetLanguages) {
					const outputFile = outputPattern
						.replace('<lang>', targetLang)
						.replace('<dir>', sourceDir);

					let targetJson = replaceAll ? {} : await readI18nextJson({ filePath: outputFile });

					const translatedJson = await translateI18nextJson({
						source: sourceJson,
						sourceLanguage,
						targetLanguage: targetLang,
						target: targetJson,
					});

					await writeI18nextJson({ filePath: outputFile, data: translatedJson });
					console.log(`Translated file written to: ${outputFile}`);
				}
			}
		} catch (error) {
			console.error('Error during translation:', error);
		}
	},
});
