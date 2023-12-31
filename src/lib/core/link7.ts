/******************************************************************************
 *
 *  This code seems to work. Because of type assertions, process() seems to
 *  return the correct type.
 *
 * TODO:
 *   1. Compare the two versions of process (one is commented out)
 *   2. Remove the type assertion to any in both versions of process()
 *   3. Remove the type assertion to any from processMux()
 *   4. Remove the type assertion to MuxOutputTypes<CHILDREN>[] from processMux()
 *
 ******************************************************************************/

// This file has a need for the use of lots of generic type parameters of type any.
/* eslint-disable @typescript-eslint/no-explicit-any */

import z from 'zod';

import {Conversation, IAvailableModels} from '../models/index.js';
import {POJO} from '../shared/index.js';

///////////////////////////////////////////////////////////////////////////////
//
// AnyLink, ModelLink, SequenceLink, MuxLink
//
///////////////////////////////////////////////////////////////////////////////
export type AnyLink<I, O> =
  | ModelLink<I, O, any>
  | SequenceLink<I, O, any, any, any, any>
  | MuxLink<I, O, any, any>;

export type ModelLink<INPUT, OUTPUT, JUDGMENT> = {
  type: 'model';
  name: string;
  model: string;
  input: (x: INPUT, context: POJO) => Conversation;
  output: (x: string) => Promise<OUTPUT>;
  train?: (x: OUTPUT) => string;
  judge?: (observed: OUTPUT, expected: OUTPUT) => Promise<JUDGMENT>;
  validators: Validators<INPUT, OUTPUT>;
};

export type SequenceLink<INPUT, OUTPUT, MIDDLE, LEFT, RIGHT, JUDGMENT> = {
  type: 'sequence';
  left: AnyLink<INPUT, MIDDLE> & LEFT;
  right: AnyLink<MIDDLE, OUTPUT> & RIGHT;
  judge?: (observed: OUTPUT, expected: OUTPUT) => JUDGMENT;
  validators: Validators<INPUT, OUTPUT>;
};

//
// MuxLink
//

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MuxLink<
  INPUT,
  OUTPUT,
  CHILDREN extends AnyLink<any, any>[],
  JUDGMENT
> = {
  type: 'mux';
  input: (x: INPUT) => MuxTypes<CHILDREN>[];
  output: (x: MuxOutputUnion<CHILDREN>[]) => Promise<OUTPUT>;
  children: CHILDREN;
  judge?: (observed: OUTPUT, expected: OUTPUT) => JUDGMENT;
  validators: Validators<INPUT, OUTPUT>;
};

export type Validators<INPUT, OUTPUT> = {
  input: z.ZodType<any, any, INPUT>;
  output: z.ZodType<any, any, OUTPUT>;
};

// The union of types of Links in a tuple.
export type MuxTypes<T> = T extends readonly [
  AnyLink<infer INPUT, any>,
  ...infer Tail
]
  ? {input: INPUT; index: number} | MuxTypes<Tail>
  : never;

// The union of OUTPUT types of Links in a tuple.
export type MuxOutputUnion<T> = T extends readonly [
  AnyLink<any, infer OUTPUT>,
  ...infer Tail
]
  ? OUTPUT | MuxOutputUnion<Tail>
  : never;

export type MuxOutputTypes<T> = T extends readonly [infer HEAD, ...infer TAIL]
  ? ProcessType<HEAD> | MuxOutputTypes<TAIL>
  : never;

///////////////////////////////////////////////////////////////////////////////
//
// TestCase
//
///////////////////////////////////////////////////////////////////////////////
export interface TestCase<T extends AnyLink<any, any>> {
  testCaseId: string;
  tags?: string[];
  sha: string;
  input: ExtractInput<T>;
  context: POJO;
  expected: TestCaseType<T>;
}

export type TestCaseType<LINK> = LINK extends ModelLink<any, any, any>
  ? TestCaseModelType<LINK>
  : LINK extends SequenceLink<any, any, any, any, any, any>
  ? TestCaseSequenceType<LINK>
  : LINK extends MuxLink<any, any, any, any>
  ? TestCaseMuxType<LINK>
  : never;

export type TestCaseModelType<LINK> = LINK extends ModelLink<
  infer INPUT,
  infer OUTPUT,
  any
>
  ? Pick<LINK, 'type' | 'name'> & {
      input?: INPUT;
      expected?: OUTPUT;
    }
  : never;

export type TestCaseSequenceType<LINK> = LINK extends SequenceLink<
  infer INPUT,
  infer OUTPUT,
  any,
  any,
  any,
  any
>
  ? Pick<LINK, 'type'> & {
      input?: INPUT;
      left: TestCaseType<LINK['left']>;
      right: TestCaseType<LINK['right']>;
      expected?: OUTPUT;
    }
  : never;

export type TestCaseMuxOutputTypes<T> = T extends readonly [
  infer HEAD,
  ...infer TAIL
]
  ? TestCaseType<HEAD> | TestCaseMuxOutputTypes<TAIL>
  : never;

export type TestCaseMuxType<LINK> = LINK extends MuxLink<
  infer INPUT,
  infer OUTPUT,
  infer CHILDREN,
  any
>
  ? Pick<LINK, 'type'> & {
      input?: INPUT;
      children: TestCaseMuxOutputTypes<CHILDREN>[];
      expected?: OUTPUT;
    }
  : never;

///////////////////////////////////////////////////////////////////////////////
//
// Processor
//
///////////////////////////////////////////////////////////////////////////////
export type ProcessType<LINK> = LINK extends ModelLink<any, any, any>
  ? ProcessModelType<LINK>
  : LINK extends SequenceLink<any, any, any, any, any, any>
  ? ProcessSequenceType<LINK>
  : LINK extends MuxLink<any, any, any, any>
  ? ProcessMuxType<LINK>
  : never;

type ProcessModelType<LINK> = LINK extends ModelLink<
  infer INPUT,
  infer OUTPUT,
  infer JUDGMENT
>
  ? Pick<LINK, 'type' | 'model' | 'name'> & {
      input: INPUT;
      prompt: Conversation;
      completion: string;
      output: OUTPUT;
      expected?: OUTPUT;
      judgment?: JUDGMENT;
    }
  : never;

export type ProcessSequenceType<LINK> = LINK extends SequenceLink<
  infer INPUT,
  infer OUTPUT,
  any,
  any,
  any,
  infer JUDGMENT
>
  ? Pick<LINK, 'type'> & {
      input: INPUT;
      left: ProcessType<LINK['left']>;
      right: ProcessType<LINK['right']>;
      output: OUTPUT;
      expected?: OUTPUT;
      judgment?: JUDGMENT;
    }
  : never;

export type ProcessMuxType<LINK> = LINK extends MuxLink<
  infer INPUT,
  infer OUTPUT,
  infer CHILDREN,
  infer JUDGMENT
>
  ? Pick<LINK, 'type'> & {
      input: INPUT;
      children: MuxOutputTypes<CHILDREN>[];
      output: OUTPUT;
      expected?: OUTPUT;
      judgment?: JUDGMENT;
    }
  : never;

// TODO: Compare the following version of process<> with the uncommented version.
// export async function process<INPUT, T extends AnyLink<INPUT,any>>(
//   models: IAvailableModels,
//   link: T,
//   input: INPUT
// ): Promise<ProcessType<T>> {
//   // TODO: remove the following type assertion to any
//   return processInternal(models, link, input) as any;
// }
export type MakeLink<T> = T extends AnyLink<any, any>
  ? AnyLink<any, any>
  : never;
export type ExtractInput<T> = T extends AnyLink<infer I, any> ? I : never;

export async function process<T>(
  models: IAvailableModels,
  link: T,
  input: ExtractInput<T>,
  context: POJO,
  testCase: TestCaseType<T>
): Promise<ProcessType<T>> {
  // TODO: remove the following type assertion to any
  return processInternal(
    models,
    link as unknown as MakeLink<T>,
    input,
    context,
    testCase
  ) as any;
}

export async function processInternal<INPUT, OUTPUT>(
  models: IAvailableModels,
  link: AnyLink<INPUT, OUTPUT>,
  input: INPUT,
  context: POJO,
  // TODO: fix type cast in processInternal
  testCase: any // TestCaseType<AnyLink<INPUT, OUTPUT>>
): Promise<ProcessType<typeof link>> {
  const type = link.type;
  if (link.type === 'model') {
    return processModel(models, link, input, context, testCase);
  } else if (link.type === 'sequence') {
    return processSequence(models, link, input, context, testCase);
  } else if (link.type === 'mux') {
    return processMux(models, link, input, context, testCase);
  } else {
    throw new Error(`Unknown link type "${type}"`);
  }
}

async function processModel<INPUT, OUTPUT, JUDGMENT>(
  models: IAvailableModels,
  link: ModelLink<INPUT, OUTPUT, JUDGMENT>,
  input: INPUT,
  context: POJO,
  testCase: TestCaseType<ModelLink<INPUT, OUTPUT, JUDGMENT>>
) {
  verifyTestCaseType(testCase, link);
  const {type, model, name, judge} = link;
  const {expected} = testCase;
  const prompt = link.input(input, context);
  const modelAPI = models.getModel(name, model);
  const completion = await modelAPI.complete(prompt);
  const output = await link.output(completion);
  const judgment =
    judge && expected ? await judge(output, expected) : undefined;
  const optionals = judge && expected ? {judgment, expected} : {};
  return {
    type,
    model,
    name,
    input,
    prompt,
    completion,
    output,
    ...optionals,
  };
}

async function processSequence<INPUT, OUTPUT, MIDDLE, LEFT, RIGHT, JUDGMENT>(
  models: IAvailableModels,
  link: SequenceLink<INPUT, MIDDLE, OUTPUT, LEFT, RIGHT, JUDGMENT>,
  input: INPUT,
  context: POJO,
  testCase: TestCaseType<
    SequenceLink<INPUT, MIDDLE, OUTPUT, LEFT, RIGHT, JUDGMENT>
  >
) {
  verifyTestCaseType(testCase, link);
  const {type, judge} = link;
  const {expected} = testCase;
  const left = await processInternal(
    models,
    link.left,
    input,
    context,
    testCase.left
  );
  const right = await processInternal(
    models,
    link.right,
    left.output,
    context,
    testCase.right
  );
  const output = right.output;
  const judgment =
    judge && expected ? await judge(output, expected) : undefined;
  const optionals = judge && expected ? {judgment, expected} : {};
  return {type, input, left, right, output, ...optionals};
}

// TODO: exported for testing
export async function processMux<
  INPUT,
  OUTPUT,
  CHILDREN extends AnyLink<any, any>[],
  JUDGMENT
>(
  models: IAvailableModels,
  link: MuxLink<INPUT, OUTPUT, CHILDREN, JUDGMENT>,
  input: INPUT,
  context: POJO,
  testCase: TestCaseMuxType<MuxLink<any, any, CHILDREN, JUDGMENT>>
) {
  verifyTestCaseType(testCase, link);
  const {type, judge} = link;
  const {expected} = testCase;
  const promises = link.input(input).map((x, i) => {
    if (x.index < 0 || x.index >= link.children.length) {
      throw new Error(`Index ${x.index} out of range in mux node.`);
    }
    const child = link.children[x.index];
    return process(models, child, x.input, context, testCase.children[i]);
  });
  const children = await Promise.all(promises);
  const outputs = children.map(x => x.output);
  // TODO: remove the following type assertion to any
  const output = await link.output(outputs as any);
  const judgment =
    judge && expected ? await judge(output, expected) : undefined;
  const optionals = judge && expected ? {judgment, expected} : {};
  // TODO: remove the following type assertion to MuxOutputTypes<CHILDREN>[]
  return {
    type,
    input,
    children: children as MuxOutputTypes<CHILDREN>[],
    output,
    ...optionals,
  };
}

///////////////////////////////////////////////////////////////////////////////
//
// Validator
//
///////////////////////////////////////////////////////////////////////////////
export function validator<INPUT, OUTPUT>(
  link: AnyLink<INPUT, OUTPUT>
): z.ZodTypeAny {
  const type = link.type;
  if (link.type === 'model') {
    return z.object({
      type: z.literal('model'),
      name: z.string(),
      expected: link.validators.output,
    });
  } else if (link.type === 'sequence') {
    return z.object({
      type: z.literal('sequence'),
      left: validator(link.left),
      right: validator(link.right),
    });
  } else if (link.type === 'mux') {
    return validatorMux(link);
  } else {
    throw new Error(`Unknown link type "${type}"`);
  }
}

function validatorMux<
  INPUT,
  OUTPUT,
  CHILDREN extends AnyLink<any, any>[],
  JUDGMENT
>(link: MuxLink<INPUT, OUTPUT, CHILDREN, JUDGMENT>) {
  const c = link.children.map(x => validator(x));
  return z.object({
    type: z.literal('mux'),
    children: z.array(z.union(c as any)),
  });
}

///////////////////////////////////////////////////////////////////////////////
//
// Utility functions
//
///////////////////////////////////////////////////////////////////////////////
function verifyTestCaseType(
  testCase: {type: string; name?: string},
  link: {type: string; name?: string}
) {
  if (testCase.type !== link.type) {
    throw new Error(
      `Type mismatch: testCase.type (${testCase.type}) !== link.type (${link.type})`
    );
  }
  if (testCase.name && link.name && testCase.name !== link.name) {
    throw new Error(
      `Name mismatch: testCase.name (${testCase.name}) !== link.name (${link.name})`
    );
  }
}
