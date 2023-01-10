#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import handleError from './handleError';
import { initMonitoring } from './helpers/monitoring';

initMonitoring();

yargs(hideBin(process.argv))
  // Use the commands directory to scaffold.
  .commandDir('commands')
  // Default command if none supplied - shows help.
  .command(
    '$0',
    'The anima CLI usage',
    () => undefined,
    () => {
      yargs.showHelp();
    },
  )
  // Enable strict mode.
  .strict()
  // Useful aliases.
  .alias({ h: 'help' })
  // Be nice.
  .epilogue(
    'For more information, check https://github.com/AnimaApp/anima-storybook-cli',
  )
  // Handle failures.
  .fail(handleError).argv;
