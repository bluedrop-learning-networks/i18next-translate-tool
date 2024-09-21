import { command, run } from 'cmd-ts';

const app = command({
  name: 'translation-tool',
  description: 'CLI tool for translating i18next locale files using AI',
  args: {},
  handler: () => {
    console.log('Hello from translation-tool!');
  },
});

run(app, process.argv.slice(2));
