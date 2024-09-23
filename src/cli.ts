import { command, run, string, positional, option, multioption } from 'cmd-ts';
import path from 'path';
import { readI18nextJson, writeI18nextJson, synchronizeI18nextJson } from './lib/i18next';
import { translateI18nextJson } from './lib/translate';

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
      type: string,
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
  },
  handler: async ({ sourceFile, targetLanguages, outputPattern }) => {
    try {
      const sourceJson = await readI18nextJson(sourceFile);

      for (const targetLang of targetLanguages) {
        const outputFile = outputPattern.replace('<lang>', targetLang);
        const targetJson = await readI18nextJson(outputFile);
        
        const synchronizedJson = synchronizeI18nextJson(sourceJson, targetJson);
        const translatedJson = await translateI18nextJson(synchronizedJson, targetLang);
        
        await writeI18nextJson(outputFile, translatedJson);
        console.log(`Translated file written to: ${outputFile}`);
      }
    } catch (error) {
      console.error('Error during translation:', error);
    }
  },
});

export const cli = command({
  name: 'translation-tool',
  description: 'CLI tool for translating i18next locale files',
  subcommands: { translate: translateCommand },
});

export const runCli = () => run(cli, process.argv.slice(2));
