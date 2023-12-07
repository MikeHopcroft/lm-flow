import {Conversation} from './conversation.js';

export interface IServiceModelConfiguration {
  endpoint: string;
  key: string;
  organization?: string;
}

export interface IModel {
  name(): string;
  complete(prompt: Conversation): Promise<string>;
  train(): Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  spec(): any; // was ModelDefinition;
}

export interface IServiceModel extends IModel {
  config: IServiceModelConfiguration;
}
