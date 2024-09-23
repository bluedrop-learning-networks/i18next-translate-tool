import { command, run, option, string } from 'cmd-ts';
import {
	readI18nextJson,
	writeI18nextJson,
	mergeI18nextJson,
	identifyUntranslatedStrings,
} from '../lib/i18next';
import { translateFile } from './translationFunctions';

const app = command({
	name: 'translation-tool',
	description: 'CLI tool for translating i18next locale files using AI',
	args: {
		sourcePath: option({
			type: string,
			long: 'source',
			short: 's',
			description: 'Path to the source i18next JSON file',
		}),
		targetPath: option({
			type: string,
			long: 'target',
			short: 't',
			description: 'Path to the target i18next JSON file',
		}),
		targetLang: option({
			type: string,
			long: 'lang',
			short: 'l',
			description: 'Target language code',
		}),
	},
	handler: async ({ sourcePath, targetPath, targetLang }) => {
		try {
			const sourceJson = await readI18nextJson(sourcePath);
			let targetJson = await readI18nextJson(targetPath);

			targetJson = mergeI18nextJson(sourceJson, targetJson);
			const untranslatedKeys = identifyUntranslatedStrings(targetJson);

			if (untranslatedKeys.length > 0) {
				console.log(`Translating ${untranslatedKeys.length} untranslated strings...`);
				await translateFile(sourcePath, targetPath, targetLang);
			} else {
				console.log('No untranslated strings found.');
			}

			await writeI18nextJson(targetPath, targetJson);
			console.log(`Translation completed: ${sourcePath} -> ${targetPath} (${targetLang})`);
		} catch (error) {
			console.error('Error during translation:', error);
		}
	},
});

run(app, process.argv.slice(2));
