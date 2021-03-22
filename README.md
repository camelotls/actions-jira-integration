# Jira Server Integration Action

## Workflow Status
![Build Status](https://github.com/camelotls/actions-jira-integration/workflows/Unit%20Tests/badge.svg)
![Build Status](https://github.com/camelotls/actions-jira-integration/workflows/Linter/badge.svg)
![Build Status](https://github.com/camelotls/actions-jira-integration/workflows/CodeQL/badge.svg)
![Build Status](https://github.com/camelotls/actions-jira-integration/workflows/Lint%20Code%20Base/badge.svg)

## Action description
A GitHub Action to integrate multiple tools with Jira Server and raise relevant issues. The action utilises [Jira's REST API version 8.4.3](https://docs.atlassian.com/software/jira/docs/api/REST/8.4.3/).

## Usage
### Inputs

|Parameter|Required|Default value|Description|
|:--:|:--:|:--:|:--:|
|JIRA_USER|true|N/A|GitHub secret for the JIRA user email for external access|
|JIRA_PASSWORD|true|N/A|GitHub secret for the JIRA API token for external access|
|JIRA_PROJECT|true|N/A|The project key for Jira|
|JIRA_URI|true|N/A|The JIRA URI for your organisation|
|INPUT_JSON|true|N/A|The JSON input to be parsed|
|REPORT_INPUT_KEYS|true|N/A|A list of keys of the input JSON you provide that will be parsed and included in the report|
|JIRA_ISSUE_TYPE|false|Security Vulnerability|Indicates if the JSON to be used for the JIRA REST calls is based on npm audit since there is a need for special treating of the overview report field|
|RUNS_ON_GITHUB|true|true|Indicates if the action runs on GitHub or locally, on a Docker container, for testing purporses|
|PRIORITY_MAPPER|false|""|Maps the severity level of the reporting issue to the relevant Jira priority score (A severity level can be skipped if not needed)|
|ISSUE_LABELS_MAPPER|true|N/A|Maps the labels of the reporting issue to the relevant Jira labels field|

### Outputs

N/A

## Example Workflow
```yaml
name: Your workflow

on:
    pull_request:

jobs:
    chore:
        name: 'This is a sample workflow incorporating the jira integration action'
        runs-on: ubuntu-latest

        steps:
            - name: Checkout uk-mobile repo
              uses: actions/checkout@v2
            - name: Use Node.js 12.x
              uses: actions/setup-node@v1
              with:
                node-version: 12.x
            - name: Prepare files
              run: |
                cp package.json ${GITHUB_WORKSPACE}/.github/actions/npm-audit/package-root.json
                cp package-lock.json ${GITHUB_WORKSPACE}/.github/actions/npm-audit/package-lock-root.json
            - name: Execute npm audit
              id: npm_audit
              uses: ./.github/actions/npm-audit
            -  name: Checkout Jira integration GitHub Action Repo
               uses: actions/checkout@v2
               with:
                repository: camelotls/actions-jira-integration
                ref: <version-to-be-pulled>
                token: ${{ secrets.MACHINEUSER_GITHUB_TOKEN }}
                path: actions-jira-integration
            - name: Jira ticket creation
              id: jira_integration
              uses: ./actions-jira-integration/
              with:
                JIRA_USER: ${{ secrets.JIRA_USER }}
                JIRA_PASSWORD: ${{ secrets.JIRA_PASSWORD }}
                # the job with id npm_audit outputs a variable called npm_audit_json
                INPUT_JSON: ${{ steps.npm_audit.outputs.npm_audit_json }}
                JIRA_PROJECT: MBIL
                JIRA_URI: 'jira.camelot.global'
                REPORT_INPUT_KEYS: |
                                    vulnerabilityName: {{module_name}}
                                    issueSummary: npm-audit: {{module_name}} module vulnerability\n
                                    issueDescription: \`*Recommendation*:\\n\\n{{recommendation}}\\n\\n*Details for {{cwe}}*\\n\\n_Vulnerable versions_:\\n\\n{{vulnerable_versions}}\\n\\n_Patched versions_:\\n\\n{{patched_versions}}\\n\\n*Overview*\\n\\n{{overview}}\\n\\n*References*\\n\\n{{url}}\\n\\n`
                                    issueSeverity: {{severity}}
                JIRA_ISSUE_TYPE: 'Security Vulnerability'
                RUNS_ON_GITHUB: true
                PRIORITY_MAPPER: |
                                     low: P3
                                     moderate: P2
                                     high: P1
                ISSUE_LABELS_MAPPER: 'security,performance' 
```

**NOTE**: when you specify the JSON keys you want to be parsed and evaluated in your final payload, you **must** enclose them in double curly brackets (`{{<keyName>}}`). This is important in order for the parsing of the action to work properly. Also, the submitted JSON **must** be in its final form that you want it to be processed (not purely the raw output of your report). An example of that is the `npm audit --json --production` output that has to be preparsed based on the given advisories (e.g. `JSON.parse(<your-input>).advisories`).

## Run the Unit Tests locally
The Unit Tests have been implemented using `Mocha` and `Chai`. For the test coverage, `nyc` is being used.

To run them locally, simply run `npm run test`.


## Run the GitHub Action locally
To run this action locally, you can simply build a Docker image and then run it to see that you get the desired result. To do so, follow the instructions below:

- Build and run your Docker image with specific arguments:

```
docker build --build-arg JIRA_USER=$JIRA_USER \
            --build-arg JIRA_PASSWORD=$JIRA_PASSWORD \
            --build-arg JIRA_PROJECT=$JIRA_PROJECT \
            --build-arg JIRA_URI=$JIRA_URI \
            --build-arg INPUT_JSON=$INPUT_JSON \
            --build-arg REPORT_INPUT_KEYS=$REPORT_INPUT_KEYS \
            --build-arg RUNS_ON_GITHUB=$RUNS_ON_GITHUB \
            -t <image_name>:<image_version> .
```

and

```
docker run <image_name>:<image_version>
```

- Build and run your Docker image based on env vars:

```
docker build -t <image_name>:<image_version> .
```

and

```
docker run -e JIRA_USER=$JIRA_USER \
            -e JIRA_PASSWORD=$JIRA_PASSWORD \
            -e JIRA_PROJECT=$JIRA_PROJECT \
            -e JIRA_URI=$JIRA_URI \
            -e INPUT_JSON=$INPUT_JSON \
            -e REPORT_INPUT_KEYS=$REPORT_INPUT_KEYS \
            -e RUNS_ON_GITHUB=$RUNS_ON_GITHUB \
            <image_name>:<image_version>
```
