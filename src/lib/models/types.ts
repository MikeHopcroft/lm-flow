import {Conversation} from './conversation.js';

export interface IModel {
  name(): string;
  complete(prompt: Conversation): Promise<string>;
  train(): Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  spec(): any; // was ModelDefinition;
}
