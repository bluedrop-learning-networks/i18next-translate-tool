import { readI18nextJson, writeI18nextJson } from './lib/i18next';
import { translateI18nextJson } from './lib/translate';
import { runCli } from './cli';

export { readI18nextJson, writeI18nextJson, translateI18nextJson, runCli };

if (require.main === module) {
  runCli();
}
