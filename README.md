# postman-newman-action

Run newman/postman collections via GitHub actions using newman 6.0.0 and newman run summary as action output for further notifications.

First of all, thanks a lot to the users [@anthonyvscode](https://github.com/anthonyvscode/newman-action) and [@matt-ball](https://github.com/matt-ball/newman-action) for creating their newman-actions, which I took as reference for this action.
What I try to accomplish with this new action is to have the best of both worlds (@anthonyvscode's + @matt-ball`s actions) + more up to date versions of dependencies.

- Making use of all available NewmanRunOptions as input
- Using node 20 instead of node 12
- Use a newer version of the newman library (6.0.0)
- Set the summary of the newman run as output, so that followup actions can use the summary, e.g., for more sophisticated notifications.

If I find time I'd also intend to include sending notifications about the run for popular messengers.

## Example Usage

```yaml
  postman-newman-action:
    name: Run Postman Newman GitHub Actions
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        id: checkout
        uses: actions/checkout@v4

      - name: Run Postman collection
        id: postman-newman-action
        uses: SimonScholz/postman-newman-action@main
        with:
            collection: "./collections/your-collection.json"
```

## Sending a summary card v2 to a Google Chat

```yaml
name: Run Postman Newman Action

on:
  workflow_dispatch:
  schedule:
    - cron: "* */2 * * *" # run the action every 2 hours

  postman-newman-action:
    name: GitHub Actions Test
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        id: checkout
        uses: actions/checkout@v4

      - name: Run Postman collection
        id: postman-newman-action
        uses: SimonScholz/postman-newman-action@main
        with:
          collection: "./collections/your-collection.json"
          outputGoogleCardV2: true

      - name: Notify Google Chat
        if: ${{ always() }} # Use always to ensure that the notification is also send on former failure
        uses: SimonScholz/google-chat-action@main
        with:
          webhookUrl: '${{ secrets.GOOGLE_CHAT_WEBHOOK_URL }}'
          additionalSections: '${{ steps.postman-newman-action.outputs.googleCardV2 }}'
          jobStatus: '${{ job.status }}'
          imageUrl: https://user-images.githubusercontent.com/7853266/44114706-9c72dd08-9fd1-11e8-8d9d-6d9d651c75ad.png
          imageAltText: 'Postman Image'

```

Besides `if: ${{ always() }}` you can of course also use any other if statement, e.g., `if: ${{ failure() }}` to only send a message on failure.

## Concatenate outputs from several collection runs using jq

You might also want to concatenate the different `googleCardV2` cards into one large card sections array so that only one card is sent at the end instead of one for every collection.

jq is a command line json parser, which can also read different json objects line by line using the `--slurp / -s` command:

```yaml
- name: Concat outputGoogleCardV2 output using jq
  id: concat-google-card-v2
  run: |
    CONCATINATED_ARRAY=echo -e "${{ steps.postman-newman-action.outputs.googleCardV2 }}\n${{ steps.postman-newman-action-two.outputs.googleCardV2 }}" | jq -s 'add'
    echo "GOOGLE_CHAT_SECTIONS_ARRAY=$CONCATINATED_ARRAY" >> "$GITHUB_OUTPUT"
```

- `echo -e` causes the `\n` to be converted into real new lines
- `jq -s 'add'` lets jq "slurp" json objects line by line while `'add'` will do the concatenation
- The result will then be written to the `$GITHUB_OUTPUT`

A complete example would look like this:

```yaml
name: Run Postman Newman Action

on:
  workflow_dispatch:
  schedule:
    - cron: "* */2 * * *" # run the action every 2 hours

  postman-newman-action:
    name: GitHub Actions Test
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        id: checkout
        uses: actions/checkout@v4

      - name: Run Postman collection
        id: postman-newman-action
        uses: SimonScholz/postman-newman-action@main
        with:
          collection: "./collections/your-collection.json"
          outputGoogleCardV2: true

      - name: Run Postman 2nd collection
        id: postman-newman-action-two
        uses: SimonScholz/postman-newman-action@main
        with:
          collection: "./collections/your-2nd-collection.json"
          outputGoogleCardV2: true

      - name: Concat outputGoogleCardV2 output using jq
        id: concat-google-card-v2
        run: |
          CONCATINATED_ARRAY=echo -e "${{ steps.postman-newman-action.outputs.googleCardV2 }}\n${{ steps.postman-newman-action-two.outputs.googleCardV2 }}" | jq -s 'add'
          echo "GOOGLE_CHAT_SECTIONS_ARRAY=$CONCATINATED_ARRAY" >> "$GITHUB_OUTPUT"

      - name: Notify Google Chat
        if: ${{ always() }}
        uses: SimonScholz/google-chat-action@main
        with:
          title: 'Concatenated Google Chat Card'
          webhookUrl: '${{ secrets.GOOGLE_CHAT_WEBHOOK_URL }}'
          additionalSections: '${{ steps.concat-google-card-v2.outputs.GOOGLE_CHAT_SECTIONS_ARRAY }}'
          jobStatus: '${{ job.status }}'
          imageUrl: https://user-images.githubusercontent.com/7853266/44114706-9c72dd08-9fd1-11e8-8d9d-6d9d651c75ad.png
          imageAltText: 'Postman Image'

```

## Inputs

| Property      | Description                     |  Default  | Required   |
| ------------- | ------------------------------- | :-------: | :--------: |
| apiKey        | The key to use the postman api used to directly access collections and environments from postman cloud |    🚫     |    🚫      |
| collection    | The exported collection.json to be run or url to collection, which needs the `apiKey` property |    🚫     |    ✅      |
| environment   | The environment.json to be used or url to environment, which needs the `apiKey` property |    🚫     |    🚫      |
| envVar        | Additional env vars, can also override the ones from the `environment`. Example: `{ "key": "host", "value": "https://simonscholz.github.io/"}`    | 🚫 |    🚫     |
| globals       | The globals.json to be used     |    🚫     |    🚫      |
| globalVar     | Additional global vars, can also override the ones from the `globals`. Example: `{ "key": "access_token", "value": "${{ secrets.ACCESS_TOKEN }}"}`     |    🚫     |    🚫      |
| exportGlobals | The relative path to export the globals file from the current run to      |    🚫     |    🚫      |
| exportEnvironment | The relative path to export the environment file from the current run to     |    🚫     |    🚫      |
| exportCollection     | The relative path to export the collection from the current run to     |    🚫     |    🚫      |
| iterationCount     | Specify the number of iterations to run on the collection. This is usually accompanied by providing a data file reference as `iterationData`    |    🚫     |    🚫      |
| iterationData     | Path to the JSON or CSV file or URL to be used as data source when running multiple iterations on a collection.     |    🚫     |    🚫      |
| folder     |   The name or ID of the folder (ItemGroup) in the collection which would be run instead of the entire collection  |    🚫     |    🚫      |
| workingDir | The path of the directory to be used as working directory.     |    🚫     |    🚫      |
| insecureFileRead     | Allow reading files outside of working directory. (type: `boolean`) |    🚫     |    🚫      |
| timeout     |  Specify the time (in milliseconds) to wait for the entire collection run to complete execution. (type: `number`)  |    Infinity     |    🚫      |
| timeoutRequest     |  Specify the time (in milliseconds) to wait for requests to return a response. (type: `number`) |    Infinity     |    🚫      |
| timeoutScript     | Specify the time (in milliseconds) to wait for scripts to return a response. (type: `number`) |    Infinity     |    🚫      |
| delayRequest     | Specify the time (in milliseconds) to wait for between subsequent requests. (type: `number`) |    0     |    🚫      |
| ignoreRedirects     | This specifies whether newman would automatically follow 3xx responses from servers. (type: `boolean`)  |    false     |    🚫      |
| insecure     | Disables SSL verification checks and allows self-signed SSL certificates. (type: `boolean`) |    false     |    🚫      |
| bail     | Specify whether or not to stop a collection run on encountering the     first test script error. "folder" allows you to skip the entire collection run in case an invalid folder was specified using the `folder` option or an error was     encountered in general. "failure" would gracefully stop a collection run after completing the current test script. (possible values: `true` or `false` or `folder` or `failure`)     |    false     |    🚫      |
| suppressExitCode     | If present, allows overriding the default exit code from the current collection run, useful for bypassing collection result failures. (type: `boolean`) |    false     |    🚫      |
| reporters     | Available reporters: cli, json, html and junit.     |    cli     |    🚫      |
| reporter     | Specify options for the reporter(s) declared in options.reporters. (type: `any`)     |    🚫     |    🚫      |
| color     | Enable or Disable colored CLI output. (possible values: `on` or `of` or `auto`) |    auto     |    🚫      |
| sslClientCert     | The path to the public client certificate file.  |    🚫     |    🚫      |
| sslClientKey | The path to the private client key file.  |    🚫     |    🚫      |
| sslClientPassphrase | The secret client key passphrase.  |    🚫     |    🚫      |
| sslClientCertList     | The path to the client certificate configuration list file. This option takes precedence over sslClientCert, sslClientKey and slClientPassphrase. When there is no match in this configuration list, sslClientCert is used as fallback. |    🚫     |    🚫      |
| sslExtraCaCerts     | The path to the file, that holds one or more trusted CA certificates in PEM format.    |    🚫     |    🚫      |
| requestAgents     | Custom HTTP(S) agents which will be used for making the requests. This allows for use of various proxies (e.g. socks) |    🚫     |    🚫      |
| cookieJar     | A tough-cookie cookieJar / file path for the current collection run. |    🚫     |    🚫      |
| outputOriginalSummary     | Whether the original summary object of the newman run should be set as output or not (type: `boolean`) |    false     |    🚫      |
| outputGoogleCardV2  | Whether the google cards v2 sections array should be set as output or not (type: `boolean`) |    false     |    🚫      |

## Outputs

| Property         | Description                               |  Activated by input   |
| ---------------- | ----------------------------------------- | :-------------------: |
| summary          | Lightweight summary object                | 🚫 (always there)     |
| originalSummary  | Original summary object of the newman run | outputOriginalSummary |
| googleCardV2     | Sections array of the google cards v2 for informative google chat notifications | outputGoogleCardV2 | 