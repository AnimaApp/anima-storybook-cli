import { loadAnimaConfig } from './../helpers/config';
import { Arguments, CommandBuilder } from 'yargs';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { getBuildDir } from '../helpers/build';
import { authenticate, getOrCreateStorybook, updateStorybook } from '../api';
import { zipDir, hashBuffer, uploadBuffer } from '../helpers';
import chalk from 'chalk';

export const command = 'sync';
export const desc = 'Sync Storybook to Figma using Anima';

export const builder: CommandBuilder = (yargs) =>
  yargs
    .options({
      token: { type: 'string', alias: 't' },
      directory: { type: 'string', alias: 'd' },
      designTokens: { type: 'string', alias: 'dt' },
      debug: { type: 'boolean', alias: 'D' },
    })
    .example([['$0 sync -t <storybook-token> -d <build-directory>']]);

export const handler = async (_argv: Arguments): Promise<void> => {
  const __DEBUG__ = !!_argv.debug;

  const [animaConfig] = await Promise.all([loadAnimaConfig()]);

  let stage = 'Checking local environment';
  let loader = ora(`${stage}...`).start();

  // check if token is provided as an arg or in .env

  const token = (_argv.token ??
    process.env.STORYBOOK_ANIMA_TOKEN ??
    '') as string;

  if (__DEBUG__) {
    console.log('token =>', token);
  }

  if (!token) {
    chalk.yellow(
      console.log(
        `Storybook token not found. Please provide a token using the --token flag or the STORYBOOK_ANIMA_TOKEN environment variable.`,
      ),
    );
    process.exit(1);
  }

  const BUILD_DIR = getBuildDir(_argv.directory as string | undefined);

  if (!fs.existsSync(path.join(process.cwd(), BUILD_DIR))) {
    chalk.yellow(
      console.log(
        `Cannot skip build, cannot find build directory: ${BUILD_DIR}} `,
      ),
    );
    process.exit(1);
  }

  const response = await authenticate(token);
  loader.stop();

  // check if token is valid
  if (!response.success) {
    chalk.red(
      console.log(
        `The Storybook token you provided "${token}" is invalid. Please check your token and try again.`,
      ),
    );
    process.exit(1);
  }

  chalk.green(console.log(`  - ${stage} ...OK`));

  stage = 'Preparing files';
  loader = ora(`${stage}...`).start();

  const zipBuffer = await zipDir(BUILD_DIR);
  const zipHash = hashBuffer(zipBuffer);

  __DEBUG__ && console.log('generated hash =>', zipHash);

  loader.stop();
  chalk.green(console.log(`  - ${stage} ...OK`));

  stage = 'Syncing files';
  loader = ora(`${stage}...`).start();

  let skipUpload = true;
  let designTokens: Record<string, any> = animaConfig.design_tokens ?? {};

  try {
    const designTokenFilePath = _argv.designTokens as string | undefined;
    if (designTokenFilePath && fs.existsSync(designTokenFilePath)) {
      designTokens = await fs.readJSON(designTokenFilePath);
    }
    // eslint-disable-next-line no-empty
  } catch (error) {}

  const data = await getOrCreateStorybook(token, zipHash, designTokens);

  const { storybookId, uploadUrl, uploadStatus } = data;

  __DEBUG__ && console.log('storybookId =>', storybookId);

  if (uploadStatus !== 'complete' && uploadUrl && storybookId) {
    skipUpload = false;
    const uploadResponse = await uploadBuffer(uploadUrl, zipBuffer);
    const upload_status = uploadResponse.status === 200 ? 'complete' : 'failed';
    await updateStorybook(token, storybookId, {
      upload_status,
      preload_stories: true,
    });
  }

  loader.stop();
  chalk.green(console.log(`  - ${stage} ...  ${skipUpload ? 'SKIP' : 'OK'} `));

  chalk.green(console.log('  - Done'));

  if (__DEBUG__) {
    console.log('_id =>', storybookId);
    console.log('hash =>', zipHash);
  }
};
