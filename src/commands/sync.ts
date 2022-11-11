import { loadAnimaConfig, loadPackageJSON } from './../helpers/config';
import { Arguments, CommandBuilder } from 'yargs';
import ora from 'ora';
import fs from 'fs-extra';
import {
  buildStorybook,
  DEFAULT_BUILD_COMMAND,
  getBuildDir,
  setupTempDirectory,
} from '../helpers/build';
import { authenticate, getOrCreateStorybook, updateStorybook } from '../api';
import { zipDir, hashBuffer, uploadBuffer } from '../helpers';
import chalk from 'chalk';

export const command = 'sync';
export const desc = 'Sync Storybook to Figma using Anima';

export const builder: CommandBuilder = (yargs) =>
  yargs
    .options({
      token: { type: 'string', alias: 't' },
      debug: { type: 'boolean', alias: 'd' },
      buildCommand: { type: 'string', alias: 'b' },
      skipBuild: { type: 'boolean', alias: 'sb' },
      silent: { type: 'boolean', alias: 's' },
      buildDir: { type: 'string', alias: 'bd' },
      designTokens: { type: 'string', alias: 'dt' },
    })
    .example([['$0 sync -f <filepath>']]);

export const handler = async (_argv: Arguments): Promise<void> => {
  const __DEBUG__ = !!_argv.debug;

  const [animaConfig, pkg] = await Promise.all([
    loadAnimaConfig(),
    loadPackageJSON(),
  ]);

  const token = (_argv.token ??
    animaConfig?.access_token ??
    process.env.STORYBOOK_ANIMA_TOKEN ??
    '') as string;

  const buildCommand = (_argv.buildCommand ??
    animaConfig?.build_command ??
    DEFAULT_BUILD_COMMAND) as string;

  if (__DEBUG__) {
    console.log('build_command =>', buildCommand);
    console.log('token =>', token);
  }

  let stage = 'Checking local environment';
  let loader = ora(`${stage}...`).start();

  if (!token) {
    throw new Error('No Storybook token provided');
  }

  if (!(buildCommand in (pkg?.scripts ?? {}))) {
    throw new Error(
      `The build command "${buildCommand}" was not found in package.json. Example: "build-storybook": "build-storybook"`,
    );
  }

  const response = await authenticate(token);
  loader.stop();

  if (!response.success) {
    throw new Error('Storybook token is invalid');
  }

  chalk.green(console.log(`  - ${stage} ... OK`));

  stage = 'Building Storybook';

  setupTempDirectory('.anima', { __DEV__: __DEBUG__ });
  const BUILD_DIR = getBuildDir(_argv.buildDir as string | undefined);
  let skipBuild = false;

  if (__DEBUG__ || !!_argv.skipBuild) {
    if (fs.existsSync(BUILD_DIR)) {
      skipBuild = true;
    } else {
      chalk.yellow(
        console.log(
          `Cannot skip build, cannot find build directory: ${BUILD_DIR}}`,
        ),
      );
    }
  }

  if (!skipBuild) {
    try {
      await buildStorybook(buildCommand, !!_argv.silent);
    } catch (error) {
      throw new Error(`Failed to build Storybook`);
    }
  }

  chalk.green(console.log(`  - ${stage} ... ${skipBuild ? 'SKIP' : 'OK'} `));

  stage = 'Preparing files';
  loader = ora(`${stage}...`).start();

  const zipBuffer = await zipDir(BUILD_DIR);
  const zipHash = hashBuffer(zipBuffer);

  __DEBUG__ && console.log('generated hash =>', zipHash);

  loader.stop();
  chalk.green(console.log(`  - ${stage} ... OK`));

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
  chalk.green(console.log(`  - ${stage} ...  ${skipUpload ? 'SKIP' : 'OK'}`));

  chalk.green(console.log('  - Done'));

  if (__DEBUG__) {
    console.log('_id =>', storybookId);
    console.log('hash =>', zipHash);
  }
};
