import {Command} from 'commander';
import dotenv from 'dotenv';
import fs from 'fs-extra';
import os from 'os';
import {v4 as uuidv4} from 'uuid';

import {
  azure_openai_api_key,
  azure_openai_endpoint,
  defaultConcurrancy,
  defaultInputFolder,
  defaultOutputFolder,
  default_openai_endpoint,
  input_folder,
  openai_api_key,
  openai_endpoint,
  openai_organization,
  output_folder,
} from '../constants.js';
import {AnyLink} from '../core/index.js';
import {
  AvailableModels,
  IAvailableModels,
  IModel,
  IServiceModelConfiguration,
  loadModels,
} from '../models/index.js';
import {
  ILogger,
  Logger,
  SuitePredicate,
  suitePredicate,
} from '../shared/index.js';

export interface Configuration {
  azure: IServiceModelConfiguration;
  cmd: string;
  concurrancy: number;
  cwd: string;
  dryrun: boolean;
  env?: string;
  filter: SuitePredicate;
  inputFolder: string;
  json: boolean;
  logger: ILogger;
  logFile?: string;
  models: IAvailableModels;
  openai: IServiceModelConfiguration;
  outputFolder: string;
  testRunId: string;
  timestamp: Date;
  user: string;
}

// Wrapper to produce Commander action function that
// captures ensemble and additionalModels.
export function wrap<
  INPUT,
  OUTPUT,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  OPTIONS extends {[key: string]: any}
>(
  f: (
    configuration: Configuration,
    ensemble: AnyLink<INPUT, OUTPUT>,
    options: OPTIONS
  ) => Promise<void>,
  ensemble: AnyLink<INPUT, OUTPUT>,
  additionalModels: IModel[]
): (this: Command, options: OPTIONS) => Promise<void> {
  // NOTE: cannot use an arrow function here because of the this: parameter.
  async function wrapper(this: Command, options: OPTIONS) {
    const logger = new Logger();

    const date = new Date();
    logger.info(
      `${this.parent!.name()} tool run "${this.name()}" command on ${date}.`,
      1
    );

    try {
      configureEnvironmentVariables(logger, options.env);
      if (!logger.hasErrors()) {
        const configuration = createConfiguration(
          logger,
          options,
          additionalModels
        );
        if (!logger.hasErrors()) {
          logger.info('', 1);
          await f(configuration, ensemble, options);
          logger.info('', 1);
        }
      }
    } catch (e) {
      if (e instanceof Error) {
        logger.error(e.message);
      } else {
        logger.error('Unknown error during configuration.');
      }
    } finally {
      console.log(logger.format());
      if (logger.hasErrors()) {
        logger.info('Command aborted.', 1);
        // eslint-disable-next-line no-process-exit
        process.exit(1);
      }
    }
  }
  return wrapper;
}

function configureEnvironmentVariables(logger: ILogger, env?: string) {
  if (env) {
    if (!fs.existsSync(env)) {
      logger.error(`Cannot find configuration file "${env}".`);
    } else {
      const status = fs.statSync(env);
      if (!status.isFile()) {
        logger.error(`Configuration path "${env}" is not a file.`);
      } else {
        logger.info(`Configuration from "${env}":`, 1);
        dotenv.config({path: env});
      }
    }
  } else {
    logger.info('Configuration from default location:', 1);
    dotenv.config();
  }
}

export interface GeneralOptions {
  concurrancy?: string;
  dryrun?: boolean;
  env?: string;
  filter?: string;
  input?: string;
  json?: boolean;
  key?: string;
  logFile?: string;
  models?: string;
  output?: string;
}

function createConfiguration(
  logger: ILogger,
  options: GeneralOptions,
  additionalModels: IModel[]
): Configuration {
  const cmd = process.argv.join(' ');
  const cwd = process.cwd();
  const dryrun = !!options.dryrun;
  const testRunId = uuidv4();
  const timestamp = new Date();
  const user = os.userInfo().username;

  const inputFolder =
    options.input || process.env[input_folder] || defaultInputFolder;
  const outputFolder =
    options.output || process.env[output_folder] || defaultOutputFolder;

  const json = !!options.json;
  const logFile = options.logFile;

  const openAIKey = (options.key || process.env[openai_api_key]) ?? '';
  const openAIEndpoint =
    process.env[openai_endpoint] ?? default_openai_endpoint;
  const openAIOrganization = process.env[openai_organization] ?? '';
  const azureOpenAIKey = process.env[azure_openai_api_key] ?? '';
  const azureOpenAIEndpoint = process.env[azure_openai_endpoint] ?? '';

  const filter = options.filter ? suitePredicate(options.filter) : () => true;

  const concurrancy = options.concurrancy
    ? Number(options.concurrancy)
    : defaultConcurrancy;

  logger.info('Configuration:', 1);
  logger.info(`  INPUT_FOLDER: ${inputFolder}`, 1);
  logger.info(`  OUTPUT_FOLDER: ${outputFolder}`, 1);
  logger.info(`  FILTER: ${options.filter || '(no filter)'}`, 1);
  logger.info(`  CONCURRANCY: ${concurrancy}`, 1);
  // WARNING: For security, do not log openAIKey

  const config = {
    azure: {
      endpoint: azureOpenAIEndpoint,
      key: azureOpenAIKey,
    },
    cmd,
    concurrancy,
    cwd,
    dryrun,
    filter,
    inputFolder,
    json,
    logFile,
    logger,
    openai: {
      endpoint: openAIEndpoint,
      key: openAIKey,
      organization: openAIOrganization,
    },
    outputFolder,
    testRunId,
    timestamp,
    user,
  };

  const modelsFile =
    options.models || process.env.MODEL_DEFINITION || './data/models.yaml';
  const modelsFromFile = loadModels(modelsFile, config);

  return {
    ...config,
    models: new AvailableModels([...modelsFromFile, ...additionalModels]),
  };
}
