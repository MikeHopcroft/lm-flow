import z from 'zod';

import {openai_api_key} from '../constants.js';

import {Conversation} from './conversation.js';
import {
  createOpenAILanguageModel,
  missingEnvironmentVariable,
  TypeChatLanguageModel,
} from './typechat-models.js';
import {IModel, IServiceModelConfiguration} from './types.js';

export const OpenAIModelDefinition = z.object({
  type: z.literal('openai'),
  name: z.string(),
  config: z.object({
    model: z.string(),
    max_tokens: z.number(),
  }),
});
export type OpenAIModelDefinition = z.infer<typeof OpenAIModelDefinition>;

export class OpenAIModel implements IModel {
  config: IServiceModelConfiguration;
  specification: OpenAIModelDefinition;
  model?: TypeChatLanguageModel;

  constructor(spec: OpenAIModelDefinition, config: IServiceModelConfiguration) {
    this.specification = spec;
    this.config = config;
  }

  name() {
    return this.specification.name;
  }

  spec() {
    return this.specification;
  }

  async complete(conversation: Conversation): Promise<string> {
    const model = this.lazyCreateTypeChatModel();
    const result = await model.complete(conversation);
    if (!result.success) {
      throw new Error(`${result.message}`);
    }
    return result.data;
  }

  train(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  private lazyCreateTypeChatModel() {
    if (!this.model) {
      const apiKey =
        this.config.key ?? missingEnvironmentVariable(openai_api_key);
      const model = this.specification.config.model;
      const endPoint = this.config.endpoint;
      const org = this.config.organization;

      this.model = createOpenAILanguageModel(apiKey, model, endPoint, org);
    }
    return this.model;
  }
}
