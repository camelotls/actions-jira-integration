# Jira Server Integration Action

A GitHub Action to integrate multiple tools with Jira Server and raise relevant issues. The action utilises [Jira's REST API version 8.4.3](https://docs.atlassian.com/software/jira/docs/api/REST/8.4.3/).

## Usage

### Inputs

|Parameter|Required|Default value|Description|
|:--:|:--:|:--:|:--:|
|JIRA_USER|true|N/A|Github secret for the JIRA user email for external access|
|JIRA_PASSWORD|true|N/A|Github secret for the JIRA API token for external access|
|JIRA_PROJECT|true|N/A|The project key for Jira|
|JIRA_URI|true|N/A|The JIRA URI for your organisation|
|INPUT_JSON|true|N/A|The JSON input to be parsed|
|REPORT_INPUT_KEYS|true|N/A|A list of keys of the input JSON you provide that will be parsed and included in the report|
|IS_NPM_AUDIT|false|false|Indicates if the JSON to be used for the JIRA REST calls is based on npm audit since there is a need for special treating of the overview report field|
|JIRA_ISSUE_TYPE|false|Security Vulnerability|Indicates if the JSON to be used for the JIRA REST calls is based on npm audit since there is a need for special treating of the overview report field|

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
            - name: Jira ticket creation
              id: jira_integration
              uses: camelotls/actions-jira-integration@latest
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
                IS_NPM_AUDIT: true
                JIRA_ISSUE_TYPE: 'Security Vulnerability'
```

**NOTE**: when you specify the JSON keys you want to be parsed and evaluated in your final payload, you **must** enclose them in double curly brackets (`{{<keyName>}}`). This is important in order for the parsing of the action to work properly. Also, the submitted JSON **must** be in its final form that you want it to be processed (not purely the raw output of your report). An example of that is the `npm audit --json --production` output that has to be preparsed based on the given advisories (e.g. `JSON.parse(<your-input>).advisories`).

## Run the Unit Tests locally
The Unit Tests have been implemented using `Mocha` and `Chai`. For the test coverage, `nyc` is being used.

To run them locally, simply run `npm run test`.
