import {
	command,
	run,
	flag,
	string,
	positional,
	option,
	multioption,
	array,
	boolean,
} from 'cmd-ts';
import { readI18nextJson, writeI18nextJson } from './lib/i18next';
import { translate } from './lib/translate';

const translateCommand = command({
	name: 'translate',
	description: 'Translate i18next JSON files',
	args: {
		sourceFile: positional({
			type: string,
			displayName: 'sourceFile',
			description: 'Path to the source language file',
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
	handler: async ({ sourceFile, targetLanguages, outputPattern, replaceAll }) => {
		try {
			console.log('Starting translation process');
			const sourceJson = await readI18nextJson({ filePath: sourceFile });

			for (const targetLang of targetLanguages) {
				const outputFile = outputPattern.replace('<lang>', targetLang);
				let targetJson = replaceAll ? {} : await readI18nextJson({ filePath: outputFile });

				const translatedJson = await translate({
					source: sourceJson,
					sourceLanguage: 'en',
					targetLanguage: targetLang,
					target: targetJson,
				});

				await writeI18nextJson({ filePath: outputFile, data: translatedJson });
				console.log(`Translated file written to: ${outputFile}`);
			}
		} catch (error) {
			console.error('Error during translation:', error);
		}
	},
});

run(translateCommand, process.argv.slice(2));
