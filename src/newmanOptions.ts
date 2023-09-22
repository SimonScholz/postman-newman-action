import * as core from '@actions/core'
import * as newman from 'newman'
import * as http from 'http'

export async function parseOptions(): Promise<newman.NewmanRunOptions> {
  const collection = get('collection')

  if (!collection) {
    throw new Error('The collection property must be provided.')
  }

  const options: newman.NewmanRunOptions = {
    collection: getCollection(collection, get('apiKey')),
    environment: getEnvironment(get('environment'), get('apiKey')),
    envVar: keyValueParse(get('envVar')),
    globals: get('globals'),
    globalVar: keyValueParse(get('globalVar')),
    exportGlobals: get('exportGlobals'),
    exportEnvironment: get('exportEnvironment'),
    exportCollection: get('exportCollection'),
    iterationCount: getNumberResultAndValidate('iterationCount'),
    iterationData: get('iterationData'),
    folder: getStringOrUndefined(get('folder')),
    workingDir: get('workingDir'),
    insecureFileRead: getBooleanOrUndefined(get('insecure')),
    timeout: getNumberResultAndValidate(get('timeout')),
    timeoutRequest: getNumberResultAndValidate(get('timeoutRequest')),
    timeoutScript: getNumberResultAndValidate(get('timeoutScript')),
    delayRequest: getNumberResultAndValidate(get('delayRequest')),
    ignoreRedirects: getBooleanOrUndefined(get('ignoreRedirects')),
    insecure: getBooleanOrUndefined(get('insecure')),
    bail: getBailValue(get('bail')),
    suppressExitCode: getBooleanOrUndefined(get('suppressExitCode')),
    reporters: getStringOrUndefined(get('reporters')),
    reporter: get('reporter'),
    color: getColor(get('color')),
    sslClientCert: get('sslClientCert'),
    sslClientKey: get('sslClientKey'),
    sslClientPassphrase: get('sslClientPassphrase'),
    sslClientCertList: getStringOrUndefined(get('sslClientCertList')),
    sslExtraCaCerts: get('sslExtraCaCerts'),
    requestAgents: requestAgentsParse(get('requestAgents')),
    cookieJar: get('cookieJar')
  }

  return removeEmpty(options)
}

const remoteCollectionOrEnv = new RegExp(
  /[\da-zA-Z]{8}-([\da-zA-Z]{4}-){3}[\da-zA-Z]{12}/g
)
const apiBase = 'https://api.getpostman.com'

function getCollection(collection: string, apiKey?: string): string {
  if (collection.match(remoteCollectionOrEnv)) {
    if (!apiKey)
      throw new Error('apiKey is required when using collection_uuid')

    return `${apiBase}/collections/${collection}?apikey=${apiKey}`
  }

  return collection
}

function getEnvironment(
  environment?: string,
  apiKey?: string
): string | undefined {
  if (environment?.match(remoteCollectionOrEnv)) {
    if (!apiKey)
      throw new Error('apiKey is required when using environment_uuid')

    return `${apiBase}/environments/${environment}?apikey=${apiKey}`
  }

  return environment
}

function get(name: string, options?: core.InputOptions): string | undefined {
  const val: string = core.getInput(name, options)
  return val !== '' ? val : undefined
}

function keyValueParse(obj: string | undefined):
  | {
      key: string
      value: string
    }
  | { key: string; value: string }[]
  | undefined {
  if (obj) {
    try {
      return JSON.parse(obj)
    } catch (e) {
      core.warning('Bad object passed in config!')
    }
  }

  return undefined
}

function requestAgentsParse(obj: string | undefined):
  | {
      http?: http.Agent | undefined
      https?: http.Agent | undefined
    }
  | undefined {
  if (obj) {
    try {
      return JSON.parse(obj)
    } catch (e) {
      core.warning('Bad object passed in config!')
    }
  }

  return undefined
}

function getStringOrUndefined(value?: string): string | string[] | undefined {
  if (!value || value === '') {
    return undefined
  }

  if (value.includes(',')) {
    return value.split(',').map(v => v.trim())
  }
  return value.trim()
}

function getBooleanOrUndefined(value?: string): boolean | undefined {
  if (!value || value === '') return undefined

  switch (value) {
    case 'true':
    case '1':
    case 'on':
    case 'yes':
      return true
    default:
      return false
  }
}

function getNumberResultAndValidate(propertyName?: string): number | undefined {
  if (!propertyName) {
    return undefined
  }

  const value = core.getInput(propertyName)
  const number = Number(value)
  if (isNaN(number)) {
    throw new Error(`${propertyName} needs to be a number`)
  }

  return getNumberOrUndefined(value)
}

function getNumberOrUndefined(value: string): number | undefined {
  if (!value || value === '') return undefined

  const result = Number(value)
  if (isNaN(result)) return undefined
  return result
}

function getBailValue(
  value?: string
): boolean | ['folder'] | ['failure'] | undefined {
  if (!value || value === '') return undefined

  if (value === 'folder') return ['folder']

  if (value === 'failure') return ['failure']

  return getBooleanOrUndefined(value)
}

function getColor(color?: string): 'on' | 'off' | 'auto' {
  if (color === 'on') return 'on'
  if (color === 'off') return 'off'
  return 'auto'
}

function removeEmpty(obj: newman.NewmanRunOptions): newman.NewmanRunOptions {
  return Object.entries(obj)
    .filter(([v]) => v != null)
    .reduce(
      (acc, [k, v]) => ({ ...acc, [k]: v }),
      {}
    ) as newman.NewmanRunOptions
}
