import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs-extra';

export const DEFAULT_BUILD_COMMAND = 'build-storybook';
const DEFAULT_BUILD_DIR = 'storybook-static';

export const buildStorybook = (
  command?: string,
  silent = false,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const buildCommand = command ?? DEFAULT_BUILD_COMMAND;

    const result = spawn('npm', ['run', buildCommand], {
      cwd: process.cwd(),
      stdio: silent ? 'ignore' : 'inherit',
    });

    result.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject();
      }
    });
  });
};

export const getBuildDir = (buildDir?: string): string => {
  return path.join(process.cwd(), buildDir ?? DEFAULT_BUILD_DIR);
};

export const setupTempDirectory = (
  dir: string,
  { __DEV__ = false } = {},
): string => {
  const TEMP_DIR = path.join(process.cwd(), dir);
  if (__DEV__) {
    fs.removeSync(TEMP_DIR);
    fs.mkdirSync(TEMP_DIR);
  }

  return TEMP_DIR;
};
