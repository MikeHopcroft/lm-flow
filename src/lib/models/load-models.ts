import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import z from 'zod';
import {generateErrorMessage} from 'zod-error';

import {Configuration} from '../app/configure.js';

import {AzureModel, AzureModelDefinition} from './azure-model.js';
import {FunctionModelDefinition, functionModels} from './function-models.js';
import {MockModel, MockModelDefinition} from './mock-model.js';
import {OpenAIModel, OpenAIModelDefinition} from './openai-model.js';
import {IModel} from './types.js';

export const ModelDefinition = z.discriminatedUnion('type', [
  AzureModelDefinition,
  FunctionModelDefinition,
  MockModelDefinition,
  OpenAIModelDefinition,
]);
type ModelDefinition = z.infer<typeof ModelDefinition>;
type ConfigForModel = Omit<Configuration, 'models'>;

export const ModelDefinitionList = z.array(ModelDefinition);
export type ModelDefinitionList = z.infer<typeof ModelDefinitionList>;

export function loadModels(filename: string, config: ConfigForModel): IModel[] {
  const ext = path.parse(filename).ext.toLowerCase();
  if (ext !== '.yaml' && ext !== 'json') {
    throw new Error(`Model ${filename} must be YAML or JSON.`);
  }
  const text = fs.readFileSync(filename, 'utf-8');
  const obj = ext === '.yaml' ? yaml.load(text) : JSON.parse(text);
  const result = ModelDefinitionList.safeParse(obj);
  if (!result.success) {
    const zodError = generateErrorMessage(result.error.issues);
    const errorMessage = `In ${filename}: ${zodError}`;
    throw new Error(errorMessage);
  }

  return result.data.map((definition: ModelDefinition) =>
    createModel(definition, config)
  );
}

export function createModel(
  definition: ModelDefinition,
  config?: ConfigForModel
): IModel {
  switch (definition.type) {
    case 'azure':
      if (!config) {
        throw new Error(
          'Model definition file references Azure model but no configuration was provided.'
        );
      }
      return new AzureModel(definition, config.azure);
    case 'function':
      if (definition.name in functionModels) {
        return functionModels[definition.name];
      } else {
        throw new Error(
          `Model definition file references unknown function model ${definition.name}.`
        );
      }
    case 'mock':
      return new MockModel(definition);
    case 'openai':
      if (!config) {
        throw new Error(
          'Model definition file references OpenAI model but no configuration was provided.'
        );
      }
      return new OpenAIModel(definition, config.openai);
    default:
      throw new Error(
        `Model definition file references unknown model type ${
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (definition as any).type
        }.`
      );
  }
}
