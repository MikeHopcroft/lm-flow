import fs from 'fs-extra';
import yaml from 'js-yaml';
import pLimit from 'p-limit';

import {Application} from './application.js';
import {Configuration, makeRunlogFilename} from './configure.js';
import {loadTestCases} from './test-cases.js';
import {Stage} from './types.js';

export async function evaluateTestCases<
  T extends ReadonlyArray<Stage<unknown, unknown, unknown>>
>(configuration: Configuration, stages: T) {
  const logger = configuration.logger;
  const testCases = await loadTestCases(configuration, stages);

  const application = new Application(stages);

  // Evaluate test cases.
  const limit = pLimit(configuration.concurrancy);
  const logs = await Promise.all(
    testCases.map(testCase =>
      limit(() => application.eval(configuration.models, testCase))
    )
  );

  const cases = logs.map((log, i) => {
    const {test_case_id, sha} = testCases[i];
    return {test_case_id, sha, log};
  });

  const {cmd, cwd, test_run_id, user} = configuration;
  const timestamp = configuration.timestamp;
  const models = [...configuration.models.models()].map(m => m.spec());
  const runLog = {test_run_id, cmd, cwd, timestamp, user, models, cases};

  // Serialize run log to disk.
  const text = yaml.dump(runLog);
  // console.log(text);

  const outfile = makeRunlogFilename(configuration);
  if (configuration.dryrun) {
    logger.info(`Ready to save run log to "${outfile}".`, 1);
  } else {
    logger.info(`Saving run log to "${outfile}".`, 1);
    await fs.ensureFile(outfile);
    fs.writeFile(outfile, text, {encoding: 'utf8'});
  }
  logger.info('finished', 1);
}
