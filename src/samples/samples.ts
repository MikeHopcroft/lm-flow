import z from 'zod';
import dedent from 'dedent';

import {ModelLink, POJO, SequenceLink, templatedInput} from '../lib/index.js';

// Type Context will replace POJO
// interface Context {
//   user: string;
//   date: Date;
// }

export const model1: ModelLink<string, number, boolean> = {
  type: 'model',
  name: 'model1',
  model: 'model1',
  input: templatedInput<string, POJO>(
    dedent`
      You are an assistant that counts the number of words in the user text prompt.
    `,
    dedent`
      {{input}} {{context.date}}
    `
  ),
  output: async (completion: string) => Number(completion),
  train: (output: number) => String(output) + '\n',
  judge: async (observed: number, expected: number) => observed === expected,
  validators: {
    input: z.string(),
    output: z.number(),
  },
};

export const model2: ModelLink<number, string, boolean> = {
  type: 'model',
  name: 'model2',
  model: 'model2',
  input: templatedInput<number, POJO>(
    dedent`
      You are an assistant that says hello the number of times specified by the user.
    `,
    dedent`
      {{input}}
    `
  ),
  output: async (completion: string) => completion,
  train: (output: string) => output,
  // train: (output: string) => String(output.match(/(hello)/g)?.length || 0),
  judge: async (observed: string, expected: string) => observed === expected,
  validators: {
    input: z.number(),
    output: z.string(),
  },
};

export const sequence1: SequenceLink<
  string,
  string,
  number,
  typeof model1,
  typeof model2,
  unknown
> = {
  type: 'sequence',
  left: model1,
  right: model2,
  validators: {input: z.string(), output: z.string()},
};
