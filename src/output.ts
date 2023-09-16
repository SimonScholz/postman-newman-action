import * as newman from 'newman'
import * as core from '@actions/core'

export function handleOutputs(summary: newman.NewmanRunSummary): void {
  outputSummary(summary)
  outputOriginalSummary(summary)
  outputGoogleCardV2(summary)
}

function outputSummary(summary: newman.NewmanRunSummary): void {
  core.setOutput('summary', createResultOutputFromSummary(summary))
}

function outputOriginalSummary(summary: newman.NewmanRunSummary): void {
  if (core.getBooleanInput('outputOriginalSummary')) {
    core.setOutput('originalSummary', JSON.stringify(summary))
  }
}

function outputGoogleCardV2(summary: newman.NewmanRunSummary): void {
  if (core.getBooleanInput('outputGoogleCardV2')) {
    console.debug(
      `Setting run of ${summary.collection.name} as googleCardV2 output`
    )
    // TODO Create google card v2 structure
    // core.setOutput('googleCardV2', JSON.stringify(summary))
  }
}

function createResultOutputFromSummary(
  summary: newman.NewmanRunSummary
): string {
  const failures = summary.run.failures.map(failure => {
    return {
      name: failure.source?.name,
      test: failure.error.test,
      message: failure.error.message
    }
  })

  return JSON.stringify({
    collection: summary.collection.name,
    failures,
    Requests: summary.run.stats.requests,
    Assertions: summary.run.stats.assertions
  })
}
