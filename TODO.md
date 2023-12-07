* V2
  * x Set up npm command - `lmflow`
  * Config
    * env
    * env file
    * cmd line args
    * .lmflow.json
    * run config file
  * Store
    * File system today, db tomorrow
    * File system walker
    * File system layout
      * Might want grouping subdirs
      * File names are uuids.extension
    * Abstraction interface - async
    * Index Map<input, TestCase2>
    * Initially expected field equivalence is string =
  * TestCase2 type
    * input
    * expected?
    * score?
    * tags
    * uuid
    * comment
  * lmflow command
    * flags
      * --dryrun
      * --nomerge
    * select
      * filter on tags
      * output format
        * structured JSON/YAML which is an array of TestCase2 - for most automation
        * .txt file of input text only - for doing a run
        * .csv file of certain columns - for using excel to label/inspect
    * upsert
      * Schema validate
    * eval
      * ensemble can be made from prompt template
    * partition
    * find - prints out path to file
* Top
  * Documentation
    * Install/build/toolchain
    * Configuration
      * .env, .env.template
      * models
      * test cases
      * outputs
    * Conceptual explanation
      * More compelling example
      * Diagram matching example
      * judge() function async to allow for LLM judgment
      * output() function async to allow for calls to external services
      * nodes
        * model
        * sequence
        * mux
        * if - can implement with mux
        * loop
    * Tips
      * Input in context vs complex type in input chain
    * Instructions on creating an ensemble
  * . Install and configure cloc
    * choco install activeperl
  * Model temperature parameter
  * Should Azure OpenAI endpoint be in AzureModelDefinition, instead of environment?
  * Train command
    * Come up with a better ensemble example seq(model1, mux(model2, model3)). Maybe even add a summarizer.
    * Should organize training cases by node name, not model name
    * Remove train() method from IModel?
      * Just keep it for ModelLink?
  * links/ensembles
    * Measure latency?
    * Measure token count?
      * https://www.npmjs.com/package/tiktoken
      * https://www.npmjs.com/package/js-tiktoken
    * All node types should have names.
    * Consider moving `input` from TestCase to TestCaseType.
      * Maybe needed for training.
      * Does this put too big a burden on TestCase authors?
      * Can sometimes infer `input` if previous stage had an `expected`.
    * Verify unique names.
    * Rename Link to Stage (or Node or something else)
    * Rename ModelDefinition to ModelSpec
    * Should AzureModelDefinition include Azure endpoint? (vs environment variable)
    * Compare runs command
      * Accept partial guid match for filename
    * Author command
      * unverified flag?
    * Extensible way to register function model implementations
    * . Azure models
    * Commander usage should have executable name, not lm-flow.
    * Command line in runlog should be array. Joining with spaces loses information (e.g. "C:\program files\...")
    * Use name field for root folder name?
      * Would need to verify os filename name safety
      * Alphanumeric, dot, dash, now .yaml or .json extensions
    * Catch exceptions at top of eval process for test case.
    * Training
      * Add createExpectedCompletion() to Link/Stage
    * model override flags
    * --dryrun
    * . Add user context to input() methods of links.
      * template parameter for CONTEXT? (extends POJO)
      * . Add Date type to POJO?
      * Pass Context | undefined?
      * Do we need a validator for Context?
      * X Not sure this makes sense. Just add context to INPUT?
        * X Need context get to multiple models - not just the first.
    * Consider introducing function stage
    * Cleanup
      * Factor AnyLink/TestCaseType/Process
      * Ensemble folder under lib? types, process, validate, train
      * Rename process to eval
      * Rename input => makePrompt, output => parsePrompt?
    * Type issues
      * TODO: fix type cast in processInternal
      * Comments at top of link7.ts
    * ILogger.info() should use level parameter.
    * New zod file loaders
      * x Restore schema validation
      * Will need special handling for cycles in graph
      * Disallow duplicate link/stage names? What about cycles?
      * Process loop limit count for cycles
      * Switch stage to loop back or move forward
    * x Convert MuxLink.input() to return child index.
    * x Rename format command to report
    * x --json
      * x Modify clean
    * x Accept yaml or json inputs
    * x Filter models in report by those actually used
    * x Sensible default for concurrancy
  * x OpenAI integration
  * x Azure OpenAI integration
    * x Make input() functions and IModel use Conversations (needed for training)
    * x Make judge() function async to allow for LLM judgment
      * x Example of calling standalone ensemble from judge()
    * x Make output() function async to allow for calls to external services
    * x Remove excess exports from lib/app/index.ts
    * x Rename test_run_id to testRunId
    * x Add `export * from './link7.js';` to lib/core/index.ts
      * x Need to get rid of types.ts first
      * x Fix imports in unit tests
    * x Add judgments to top level of test case.
      * x Allow expected and judge functions on sequence and mux
      * x Sequence
      * x Mux
    * x Revert appplication.ts, keep trainer.ts for now
    * x End-to-end integration
      * x Integrate with evaluateTestCases
      * x Remove stage
      * x Pass optional TestCase argument through process
      * x Remove `expected` from link
    * x Integration
      * x Single model
    * x TestCaseType
    * x Handlebars input function generator.
    * x TODO: throw if overwriting SHA
    * x TODO: throw if overwriting test_case_id
    * x Fix prettier configuration after move to pure ESM packages
    * x judge() and expected
  * Factoring for use as a package
    * X Application object
    * x Ability to inject models and ensembles
    * Ability to configure command-line arguments
    * Also special folder that is .gitignored
    * X Stage definition file? - decided not to do this
    * x Remove pipelines folder
  * iterator symbol for AvailableModels
  * Eliminate concept of stage model override - put in config file?
  * Separate folders for
    * config
    * runs
    * training
    * tests
  * Add context to TestCases
  * . Model definition should not reside in data/cases.
  * Consider hashing object without tags field.
    * Parse, remove tags, serialize, hash.
  * x Constants for environment variable and file names
  * . Models definition file and command-line argument
    * Need to decide default configuration location (models and stages)
  * Test result formatter
    * Handling dates
    * Do we still need luxon?
  * Pipeline vs graph
    * Force type error if ZodTypes are wrong in Stage.types.
  * Move .env configuration out of configure() - separate from logger.
  * Reorganize types.ts
  * Configure mocha and test runner
  * x Mocha
    * x configure
    * x Boolean expression parser cases
    * x Link cases - migrage from link7Test.ts
  * NPM
    * x Minimal README.md
    * x Test in dev container
    * x Fix mocha test explorer in dev container
    * x Cannot find configuration file "./.env". when no .env file.
    * x rename/create new model-flow repo
    * delete all but readme from this repo
    * x rename package to model-flow
    * x upgrade to 0.0.1
    * x publish
    * x sample usage repo
  * x Rename
    * x model-flow
    * x lms (language model simulator)
    * x ensemble
    * x lang-flow
    * x combo
    * x sim


  * Command check for duplicate flags?
  * console.log() => logger.log()
  * Rework wrapper now that Configuration contains logger
  * x Add command line, configuration, user, cwd to log, run file name/id
  * x Write logs
    * Need ability to write failed log.
    * Need some way to parse logs without pipeline
    * x Naming - run folder - Date followed by GUID?
  * Test runner
    * Move makeStages() to configuration.
    * x Move makeModels() to configuration.
    * x Clean command
    * Batch running
      * x Concurrancy in test cases
      * Concurrancy in LLM calls?
  * Clean up variable, function, class, type naming
  * . Add logging to inference and eval
  * Separate inference from eval
  * Handle exceptions in eval
  * x Move configure.ts into core
  * x Rename stage functions
    * x makePrompt
    * x parseCompletion
    * x makeTrainingCase
  * x Add hash to test cases
  * x Test case loader/validator
  * x Zod
  * x Recommended extensions
  * x Dev container
* README.md
  * Toolchain configuration
  * Build
  * Run
  * Explain design
  * Scenarios
    * Use a set of test cases to evaluate model
    * Format the output of an evaluation run
    * Use a set of test cases to train a model
    * Create a test case
* Reuse
  * LLM invocation
  * x File tree walker
  * x Filter by boolean tag expressions
  * x Bring over suite-predicate.test.ts
  * x SHA computation
  * x LICENSE
* Configure
  * Jest or Mocha tests
  * x Commander
  * x Dotenv
  * x .gitignore
  * x Node engine version
* Design
  * Naming convention
  * TestCase file
  * EvaluationResult file
  * Training set
  * -models option
  * Project
  * BackProject
  * Format command?
* Steps
  * Format results
    * Summary
    * Results CSV
    * Logs
* See note on fs-extra@9.0.13: https://github.com/DefinitelyTyped/DefinitelyTyped/issues/51521 





* Pure ESM: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c
* Pure ESM Gist: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c
* Typescript: https://www.typescriptlang.org/docs/handbook/modules/reference.html#node16-nodenext
* Migration: https://dev.to/logto/migrate-a-60k-loc-typescript-nodejs-repo-to-esm-and-testing-become-4x-faster-12-5f82


~~~
// Experiment to see if higher kinded types could be used to
// reduce code duplication in Mux
// https://stackoverflow.com/questions/37323581/how-to-specify-generic-type-as-a-generic-higher-kinded-types?rq=4
// https://stackoverflow.com/questions/64394190/how-to-have-a-generic-type-argument-be-itself-a-generic
// https://github.com/microsoft/TypeScript/issues/1213
// export type MuxMap<F, T> = T extends readonly [
export type MuxMap<G, F extends G<any>, T> = T extends readonly [
  infer HEAD,
  ...infer TAIL
]
  ? F<HEAD> | MuxMap<F, TAIL>
  : never;
~~~