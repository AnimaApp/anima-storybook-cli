import { loadAnimaConfig } from './../helpers/config';
import { Arguments, CommandBuilder } from 'yargs';
import ora from 'ora';
import fs from 'fs-extra';
import { DEFAULT_BUILD_DIR, getBuildDir } from '../helpers/build';
import {
  authenticate,
  getOrCreateStorybook,
  updateDSTokenIfNeeded,
  updateStorybook,
} from '../api';
import { zipDir, hashBuffer, uploadBuffer, log } from '../helpers';
import * as Sentry from '@sentry/node';

export const command = 'sync';
export const desc = 'Sync Storybook to Figma using Anima';

export const builder: CommandBuilder = (yargs) =>
  yargs
    .options({
      token: { type: 'string', alias: 't' },
      directory: { type: 'string', alias: 'd' },
      designTokens: { type: 'string' },
      debug: { type: 'boolean' },
    })
    .example([['$0 sync -t <storybook-token> -d <build-directory>']]);

export const handler = async (_argv: Arguments): Promise<void> => {
  const transaction = Sentry.startTransaction({
    op: 'start-sync',
    name: 'start sync process',
  });
  Sentry.getCurrentHub().configureScope((scope) => scope.setSpan(transaction));

  const __DEBUG__ = !!_argv.debug;

  const animaConfig = await loadAnimaConfig();

  let stage = 'Checking local environment';
  let loader = ora(`${stage}...\n`).start();

  // check if token is provided as an arg or in .env
  const token = (_argv.token ??
    process.env.STORYBOOK_ANIMA_TOKEN ??
    '') as string;

  if (__DEBUG__) {
    console.log('token =>', token);
  }

  if (!token) {
    loader.stop();
    log.yellow(
      `Storybook token not found. Please provide a token using the --token flag or the STORYBOOK_ANIMA_TOKEN environment variable.`,
    );
    process.exit(1);
  }

  // check if build directory exists
  const BUILD_DIR = getBuildDir(_argv.directory as string | undefined);
  if (!fs.existsSync(BUILD_DIR)) {
    loader.stop();
    log.yellow(
      `Cannot find build directory: "${
        _argv.directory ?? DEFAULT_BUILD_DIR
      }". Please build storybook before running this command `,
    );
    Sentry.captureException(new Error('Cannot find build directory'));
    transaction.status = 'error';
    transaction.finish();
    process.exit(1);
  }

  const authSpan = transaction.startChild({ op: 'authenticate' });
  // validate token with the api
  const response = await authenticate(token);
  loader.stop();
  if (!response.success) {
    log.red(
      `The Storybook token you provided "${token}" is invalid. Please check your token and try again.`,
    );
    Sentry.captureException(
      new Error(
        "The Storybook token you provided 'HIDDEN' is invalid. Please check your token and try again.",
      ),
    );
    authSpan.status = 'error';
    authSpan.finish();
    transaction.finish();
    process.exit(1);
  }
  authSpan.finish();

  log.green(`  - ${stage} ...OK`);

  const spanZipBuild = transaction.startChild({ op: 'zip-build-and-hash' });
  // zip the build directory and create a hash
  stage = 'Preparing files';
  loader = ora(`${stage}...`).start();

  const zipBuffer = await zipDir(BUILD_DIR);
  const zipHash = hashBuffer(zipBuffer);

  __DEBUG__ && console.log('generated hash =>', zipHash);
  spanZipBuild.finish();

  loader.stop();
  log.green(`  - ${stage} ...OK`);

  const spanGetDSToken = transaction.startChild({ op: 'get-ds-token' });
  // create storybook object if no record with the same hash is found and upload it
  stage = 'Syncing files';
  loader = ora(`${stage}...`).start();

  let skipUpload = true;
  let designTokens: Record<string, unknown> = animaConfig.design_tokens ?? {};

  // check if design tokens json is provided and add it to the payload
  const designTokenFilePath = _argv.designTokens as string | undefined;
  try {
    if (designTokenFilePath) {
      if (fs.existsSync(designTokenFilePath)) {
        designTokens = await fs.readJSON(designTokenFilePath);
      } else {
        throw new Error('Path not found');
      }
    }
  } catch (error) {
    const errorMessage = `Fail to read design tokens at path "${designTokenFilePath}"`;
    loader.stop();
    log.yellow(errorMessage);
    Sentry.captureException(
      new Error("Fail to read design tokens at path 'HIDDEN'"),
    );
    spanGetDSToken.status = 'error';
    spanGetDSToken.finish();
    transaction.finish();
    process.exit(1);
  }

  spanGetDSToken.finish();

  const data = await getOrCreateStorybook(token, zipHash, designTokens);

  const spanUpload = transaction.startChild({
    op: 'upload-process',
  });
  Sentry.getCurrentHub().configureScope((scope) => scope.setSpan(spanUpload));
  const { storybookId, uploadUrl, dsTokens } = data;
  let { uploadStatus } = data;

  __DEBUG__ && console.log('storybookId =>', storybookId);

  if (uploadStatus !== 'complete' && uploadUrl && storybookId) {
    skipUpload = false;
    const uploadResponse = await uploadBuffer(uploadUrl, zipBuffer);
    const upload_status = uploadResponse.status === 200 ? 'complete' : 'failed';
    await updateStorybook(token, storybookId, {
      upload_status,
      preload_stories: true,
    });
    uploadStatus = upload_status;
  }
  if (storybookId && uploadStatus === 'complete') {
    await updateDSTokenIfNeeded({
      storybook: {
        id: storybookId,
        ds_tokens: dsTokens,
        upload_status: uploadStatus,
      },
      token,
      currentDSToken: designTokens,
    }).catch((e) => {
      Sentry.captureException(e);
      log.yellow(`Fail to update designTokens, ${e.message}`);
    });
  }

  loader.stop();
  spanUpload.finish();
  transaction.status = 'ok';
  transaction.finish();
  log.green(
    `  - ${stage} ...  ${skipUpload ? (__DEBUG__ ? 'SKIP' : 'OK') : 'OK'} `,
  );
  log.green('  - Done');

  if (__DEBUG__) {
    console.log('_id =>', storybookId);
    console.log('hash =>', zipHash);
  }
};
