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
  const failedRequestText =
    summary.run.stats.requests.failed !== undefined &&
    summary.run.stats.requests.failed > 0
      ? `<font color="#FF0B0B">${summary.run.stats.requests.failed}</font>`
      : '0'
  const failedAssertText =
    summary.run.stats.assertions.failed !== undefined &&
    summary.run.stats.assertions.failed > 0
      ? `<font color="#FF0B0B">${summary.run.stats.assertions.failed}</font>`
      : '0'
  const defaultWidgets: unknown[] = [
    {
      decoratedText: {
        startIcon: { knownIcon: 'DESCRIPTION' },
        wrapText: false,
        text: `<b>Collection:</b> ${summary.collection.name}`
      }
    },
    {
      decoratedText: {
        startIcon: { knownIcon: 'MEMBERSHIP' },
        wrapText: false,
        text: `<b>Requests:</b> Total: ${summary.run.stats.requests.total} Failed: ${failedRequestText}`
      }
    },
    {
      decoratedText: {
        startIcon: { knownIcon: 'MEMBERSHIP' },
        wrapText: false,
        text: `<b>Assertions:</b> Total: ${summary.run.stats.assertions.total} Failed: ${failedAssertText}`
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
        wrapText: false,
        text: `<b>Name:</b> ${failure.source?.name} <br><b>Test:</b> ${failure.error.test} <br><b>Message:</b> ${failure.error.message}`
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
