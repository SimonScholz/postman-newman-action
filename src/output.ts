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
    const googleCardV2 = JSON.stringify(
      createGoogleCardV2StructureOutput(summary)
    )
    console.log(googleCardV2)
    core.setOutput('googleCardV2', googleCardV2)
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
            'https://raw.githubusercontent.com/SimonScholz/google-chat-action/main/assets/failure-128.png'
        },
        wrapText: true,
        text: `<b>Name:</b> ${failure.source?.name} <br><b>Test:</b> ${failure.error.test} <br><b>Message:</b> ${failure.error.message}`
      }
    }
  })

  const headerText =
    summary.run.failures.length > 0
      ? `<font color="#FF0B0B">${summary.collection.name} - ${summary.run.failures.length} Failure(s)</font>`
      : summary.collection.name

  return [
    {
      header: headerText,
      collapsible: true,
      uncollapsibleWidgetsCount: 0,
      widgets: defaultWidgets.concat(failureWidgets)
    }
  ]
}
