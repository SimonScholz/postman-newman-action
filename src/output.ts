import * as newman from 'newman'

export function createResultOutputFromSummary(
  summary: newman.NewmanRunSummary
): string {
  const failures = summary.run.failures.map(failure => {
    return {
      name: failure.source?.name,
      test: failure.error.name,
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
