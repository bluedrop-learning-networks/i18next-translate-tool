import { command, run, option, string } from 'cmd-ts';
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
      await translateFile(sourcePath, targetPath, targetLang);
      console.log(`Translation completed: ${sourcePath} -> ${targetPath} (${targetLang})`);
    } catch (error) {
      console.error('Error during translation:', error);
    }
  },
});

run(app, process.argv.slice(2));
