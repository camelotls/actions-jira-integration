# jira integration action

GitHub Action to integrate multiple tools with Jira and raise relevant issues.

## Usage

### Inputs

|Parameter|Required|Description|
|:--:|:--:|:--:|
|JIRA_USER|true|Github secret for the JIRA user email for external access|
|JIRA_PASSWORD|true|Github secret for the JIRA API token for external access|
|JIRA_PROJECT|true|The project key for Jira|
|INPUT_JSON|true|The JSON input to be parsed|
|TOOL_NAME|true|The tool generated the JSON to be parsed|

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
            -  name: Jira ticket creation
               id: jira_integration
               uses: camelotls/actions-jira-integration@latest
               env:
                JIRA_PROJECT: Project
                TOOL_NAME: ToolName
               with:
                  JIRA_USER: ${{ secrets.JIRA_USER }}
                  JIRA_PASSWORD: ${{ secrets.JIRA_PASSWORD }}
                  JIRA_PROJECT: $JIRA_PROJECT
                  INPUT_JSON: ${{ steps.npm_audit.outputs.npm_audit_json }}
                  TOOL_NAME: $TOOL_NAME
```
