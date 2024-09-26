#!/usr/bin/env node

import { argv } from 'node:process';
import { run } from 'cmd-ts';
import { i18nextTranslate } from './cmd.js';

await run(i18nextTranslate, argv.slice(2));
