import { resolve } from 'path';
import { readFileSync, existsSync } from 'fs-extra';
import { loadConfig, LoadConfigOptions } from 'c12';
import { readPackageJSON, resolvePackageJSON, PackageJson } from 'pkg-types';

interface AnimaConfig {
  design_tokens?: Record<string, unknown>;
  build_command?: string;
}

export const loadAnimaConfig = async (): Promise<AnimaConfig> => {
  // load anima.config.(js|ts) file
  const loadOptions: LoadConfigOptions = { dotenv: true, rcFile: false };
  const [{ config: tsConfig }, { config: jsConfig }] = await Promise.all([
    loadConfig<AnimaConfig>({
      configFile: 'anima.config.js',
      ...loadOptions,
    }),
    loadConfig<AnimaConfig>({
      configFile: 'anima.config.ts',
      ...loadOptions,
    }),
  ]);

  // load .animarc file
  const rcFile = resolve('.animarc');
  let rcConfig: AnimaConfig = {};

  if (existsSync(rcFile)) {
    try {
      rcConfig = JSON.parse(readFileSync(rcFile, 'utf-8'));
      // eslint-disable-next-line no-empty
    } catch (e) { }
  }

  // load anima.config.json file
  const jsonFile = resolve('anima.config.json');
  let jsonConfig: AnimaConfig = {};

  if (existsSync(jsonFile)) {
    try {
      jsonConfig = JSON.parse(readFileSync(jsonFile, 'utf-8'));
      // eslint-disable-next-line no-empty
    } catch (e) { }
  }

  return {
    ...rcConfig,
    ...jsonConfig,
    ...(jsConfig ?? {}),
    ...(tsConfig ?? {}),
  };
};

export const loadPackageJSON = async (): Promise<PackageJson | null> => {
  try {
    const pkg = await readPackageJSON(await resolvePackageJSON());
    return pkg;
  } catch (error) {
    return null;
  }
};
