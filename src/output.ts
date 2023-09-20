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
    core.setOutput(
      'googleCardV2',
      JSON.stringify(createGoogleCardV2StructureOutput(summary))
    )
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

function createGoogleCardV2StructureOutput(
  summary: newman.NewmanRunSummary
): unknown[] {
  const defaultWidgets: unknown[] = [
    {
      decoratedText: {
        startIcon: { knownIcon: 'DESCRIPTION' },
        text: `Collection: ${summary.collection.name}`
      }
    },
    {
      decoratedText: {
        startIcon: { knownIcon: 'MEMBERSHIP' },
        text: `<b>Requests:</b> Total: ${summary.run.stats.requests.total} Failed: ${summary.run.stats.requests.failed}`
      }
    },
    {
      decoratedText: {
        startIcon: { knownIcon: 'MEMBERSHIP' },
        text: `<b>Assertions:</b> Total: ${summary.run.stats.assertions.total} Failed: ${summary.run.stats.assertions.failed}`
      }
    }
  ]

  const failureWidgets: unknown[] = summary.run.failures.map(failure => {
    return {
      decoratedText: {
        startIcon: {
          iconUrl:
            'https://cdn2.iconfinder.com/data/icons/kids/128x128/apps/agt_action_fail.png'
        },
        text: `<b>Name:</b> ${failure.source?.name} \n<b>Test:</b> ${failure.error.test} \n<b>Message:</b> ${failure.error.message}`
      }
    }
  })

  return [
    {
      header: `Newman Test Run`,
      collapsible: true,
      uncollapsibleWidgetsCount: 3,
      widgets: defaultWidgets.concat(failureWidgets)
    }
  ]
}
