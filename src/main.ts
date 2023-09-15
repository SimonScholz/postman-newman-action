import * as core from '@actions/core'
import * as newman from 'newman'
import { parseOptions } from './newmanOptions'
import { createResultOutputFromSummary } from './output'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const options = await parseOptions()
    newman
      .run(options)
      .on('done', (err: Error, summary: newman.NewmanRunSummary) => {
        core.setOutput('original_summary', JSON.stringify(summary))
        core.setOutput('summary', createResultOutputFromSummary(summary))
        errorHandling(options, err, summary)
      })
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    } else if (typeof error === 'string') {
      core.setFailed(error)
    } else {
      core.setFailed('unexpected error')
    }
  }
}

function errorHandling(
  options: newman.NewmanRunOptions,
  err: Error,
  summary: newman.NewmanRunSummary
): void {
  if (
    !options.suppressExitCode &&
    (err || summary.error || summary.run.failures.length)
  ) {
    const errorMessage: string = (err && `Error: ${err.message}`) || ''
    const summaryError: string =
      (summary.error && ` Summary Error: ${summary.error}`) || ''
    const failureAmount: string =
      (summary.run.failures.length &&
        ` Failure amount: ' ${summary.run.failures.length}`) ||
      ''

    core.setFailed(
      `Newman run failed ${errorMessage} ${summaryError} ${failureAmount}`
    )
  }
}
