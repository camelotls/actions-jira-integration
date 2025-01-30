# Jira Server Integration Action

## Workflow Status
![Build Status](https://github.com/camelotls/actions-jira-integration/workflows/Unit%20Tests/badge.svg)
![Build Status](https://github.com/camelotls/actions-jira-integration/workflows/Linter/badge.svg)
![Build Status](https://github.com/camelotls/actions-jira-integration/workflows/CodeQL/badge.svg)
![Build Status](https://github.com/camelotls/actions-jira-integration/workflows/Lint%20Code%20Base/badge.svg)

## Action description
A GitHub Action to integrate multiple tools with Jira Server and raise relevant issues.

## Usage
### Inputs

|Parameter|Required|Default value|Description|
|:--:|:--:|:--:|:--:|
|JIRA_ON_CLOUD|false|false|If you are using Jira on Cloud set this environment variable to true|
|JIRA_CLOUD_TOKEN|false|N/A|Github secret for the JIRA basic authentication token. NOTE: Should be in base64|
|JIRA_USER|false|N/A|GitHub secret for the JIRA user email for external access|
|JIRA_PASSWORD|false|N/A|GitHub secret for the JIRA API token for external access|
|JIRA_PROJECT|true|N/A|The project key for Jira|
|JIRA_URI|true|N/A|The JIRA URI for your organisation|
|INPUT_JSON|true|N/A|The path where the JSON input to be parsed|
|REPORT_INPUT_KEYS|true|N/A|A list of keys of the input JSON you provide that will be parsed and included in the report|
|ISSUE_TYPE|true|""|Indicates if the JSON to be used for the JIRA REST calls is based on npm audit since there is a need for special treating of the overview report field|
|RUNS_ON_GITHUB|true|true|Indicates if the action runs on GitHub or locally, on a Docker container, for testing purporses|
|PRIORITY_MAPPER|false|""|Maps the severity level of the reporting issue to the relevant Jira priority score (A severity level can be skipped if not needed)|
|ISSUE_LABELS_MAPPER|true|N/A|Maps the labels of the reporting issue to the relevant Jira labels field|
|LOAD_BALANCER_COOKIE_ENABLED|false|""|Extra cookie needed for clustered Jira server to accommodate different Load Balancers such as F5, httpd etc.|
|LOAD_BALANCER_COOKIE_NAME|false|""|The name of the cookie for the Load Balancer (if any used)|
|UPLOAD_FILES|false|false|Uploads a file to each Jira issue created based on a comparison of the file name and its relation to each ticket issueSummary|
|UPLOAD_FILES_PATH|false|""|Used only if UPLOAD_FILE is set to true. It's the path holding the files to be uploaded|
|JQL_SEARCH_PAYLOAD_RESOLVED_ISSUES|false|""|The filter you want to apply in order to check for issues that have already been resolved. It is the jql query you get from the \"Advanced\" section while searching Jira tickets and it's used for the duplication mechanism prevention|
|JQL_SEARCH_PAYLOAD_OPEN_ISSUES|false|""|The filter you want to apply in order to check for issues that are already Open. It is the jql query you get from the \"Advanced\" section while searching Jira tickets and it's used for the duplication mechanism prevention|
|EXTRA_JIRA_FIELDS|false|""|Provide the extra fields you need to include in the payload sent to Jira during an issue creation.

### Outputs

| Name                | Description                                                            | Example |
| --                  | --                                                                     | --      |
| created-jira-issues | Contains a JSON array of all the issues created in Jira by the action | <pre>[<br>  {<br>    "key": "HT-0",<br>    "url": "https://jira.instance/browse/HT-0"  <br>  },<br>  {<br>    "key": "HT-1",<br>    "url": "https://jira.instance/browse/HT-1"<br>  }<br>]</pre> |

## Example Workflow
```yaml
name: Your workflow

on:
    pull_request:

jobs:
      name: 'This is a sample workflow incorporating the jira integration action'
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
          with:
            ref: ${{ github.event.pull_request.head.sha }}
        - name: Install pnpm
          uses: pnpm/action-setup@v4
          with:
            version: 9
        - name: Use Node.js 20
          uses: actions/setup-node@v4
          with:
            node-version: 20
        - name: Install Dependencies
          run: pnpm install
        - name: Prepare files
          run: |
            cp package.json ${GITHUB_WORKSPACE}/.github/actions/npm-audit/package-root.json
            cp package-lock.json ${GITHUB_WORKSPACE}/.github/actions/npm-audit/package-lock-root.json
        - name: Execute npm audit
          id: npm_audit
          uses: ./.github/actions/npm-audit
        -  name: Checkout Jira integration GitHub Action Repo
           uses: actions/checkout@v4
           with:
            repository: camelotls/actions-jira-integration
            ref: <version-to-be-pulled>
            token: ${{ secrets.MACHINEUSER_GITHUB_TOKEN }}
            path: actions-jira-integration
        - name: Jira ticket creation
          id: jira_integration
          uses: ./actions-jira-integration/
          env:
            ISSUE_TYPE: 'Security Vulnerability'
            ISSUE_LABELS_MAPPER: 'Security,Triaged,npm_audit_check'
            JIRA_PROJECT: MBIL
          with:
            JIRA_ON_CLOUD: 'false'
            JIRA_CLOUD_TOKEN: ${{ secrets.JIRA_CLOUD_TOKEN }}
            JIRA_USER: ${{ secrets.JIRA_USER }}
            JIRA_PASSWORD: ${{ secrets.JIRA_PASSWORD }}
            # the job with id npm_audit outputs a variable called npm_audit_json
            INPUT_JSON: './report.json'
            JIRA_PROJECT: ${{ env.JIRA_PROJECT }}
            JIRA_URI: 'jira.camelot.global'
            REPORT_INPUT_KEYS: |
                                issueName: {{module_name}}
                                issueSummary: npm-audit: {{module_name}} module vulnerability\n
                                issueDescription: \`*Recommendation*:\\n\\n{{recommendation}}\\n\\n*Details for {{cwe}}*\\n\\n_Vulnerable versions_:\\n\\n{{vulnerable_versions}}\\n\\n_Patched versions_:\\n\\n{{patched_versions}}\\n\\n*Overview*\\n\\n{{overview}}\\n\\n*References*\\n\\n{{url}}\\n\\n`
                                issueSeverity: {{severity}}
            ISSUE_TYPE: ${{ env.ISSUE_TYPE }}
            RUNS_ON_GITHUB: true
            PRIORITY_MAPPER: |
                                 low: P3
                                 moderate: P2
                                 high: P1
            ISSUE_LABELS_MAPPER: 'security,performance' 
            LOAD_BALANCER_COOKIE_ENABLED: true
            LOAD_BALANCER_COOKIE_NAME: 'AWSALB'
            UPLOAD_FILES: true
            UPLOAD_FILES_PATH: './upload_file_path'
            JQL_SEARCH_PAYLOAD_RESOLVED_ISSUES: 'project=${{ env.JIRA_PROJECT }} AND type="${{ env.ISSUE_TYPE }}" AND labels IN (${{ env.ISSUE_LABELS_MAPPER }}) AND status=Done AND resolution IN (Obsolete,Duplicate,"Won''t Do")'
            JQL_SEARCH_PAYLOAD_OPEN_ISSUES: 'project=${{ env.JIRA_PROJECT }} AND type="${{ env.ISSUE_TYPE }}" AND labels IN (${{ env.ISSUE_LABELS_MAPPER }}) AND status NOT IN (Done)'
            EXTRA_JIRA_FIELDS: |
                                  environment: environment
                                  components.{id}: [npm]
                                  versions: [release 7]
```
**NOTE**: when you specify the JSON keys you want to be parsed and evaluated in your final payload, you **must** enclose them in double curly brackets (`{{<keyName>}}`). This is important for the parsing of the action to work properly. Also, the submitted JSON **must** be in its final form that you want it to be processed (not purely the raw output of your report).

**NOTE**: if the extra field you want to add contains an array with nested objects as values you should enclose the key of the objects in single curly brackets (`{<keyName>}`). For example `components.{id} : [value1, value2]` will result in: `{
components: [{ id: value1 }, { id: value2 }] 
}`.

**Example**:
Let's say you use this action to connect it with Nowsecure. The output of Nowsecure should be formatted in the following way:
```
{
    "6b2a7a6d-a7e5-48a0-b8c9-ddbbf9b2038d": {
        "key": "local_auth_check",
        "title": "Application Includes Insecure Library for Processing Biometric Authentication",
        "description": "The Local Authentication library was found included in your application binary. At worst, it is being used for biometric authentication that is easily bypassed by someone with access to the device. At best, it is extraneous functionality that should not be included in the app as a best practice.",
        "recommendation": "Consider using Keychain ACLs (Access Control Lists) to achieve similar\nfunctionality.\n\nAn example implementation would store the application's\nsecret in a Keychain and assign an ACL to this Keychain item that would\ninstruct iOS to perform a user presence check before reading and returning\nthe Keychain item to the application. Sample code can be found\non [Apple's website](https://developer.apple.com/documentation/localauthentication/accessing_keychain_items_with_face_id_or_touch_id).",
        "severity": "low"
    },
    "6e53cd8c-e317-4af0-8b38-d81728301a4d": {
        "key": "local_auth_check",
        "title": "Application Includes Insecure Library for Processing Biometric Authentication",
        "description": "The Local Authentication library was found included in your application binary. At worst, it is being used for biometric authentication that is easily bypassed by someone with access to the device. At best, it is extraneous functionality that should not be included in the app as a best practice.",
        "recommendation": "Consider using Keychain ACLs (Access Control Lists) to achieve similar\nfunctionality.\n\nAn example implementation would store the application's\nsecret in a Keychain and assign an ACL to this Keychain item that would\ninstruct iOS to perform a user presence check before reading and returning\nthe Keychain item to the application. Sample code can be found\non [Apple's website](https://developer.apple.com/documentation/localauthentication/accessing_keychain_items_with_face_id_or_touch_id).",
        "severity": "low"
    },
    {...}
}
```

So, you'll have as a basis:

```
{
    "<uid>": {
        "<key-1>": "<key-1> fed via REPORT_INPUT_KEYS",
        "<key-2>": "<key-2> fed via REPORT_INPUT_KEYS",
        "<key-3>": "<key-3> fed via REPORT_INPUT_KEYS",
        "<key-4>": "<key-4> fed via REPORT_INPUT_KEYS"
        "<key-5>": "<key-5> fed via REPORT_INPUT_KEYS"
    },
    {...}
}
```

## Run the Unit Tests locally
The Unit Tests have been implemented using `Mocha` and `Chai`. For the test coverage, `nyc` is being used.

To run them locally, simply run `npm run test`.


## Run the GitHub Action locally
To run this action locally, you can simply build a Docker image and then run it to see that you get the desired result. To do so, follow the instructions below:

- Build and run your Docker image with specific arguments:

```
docker build --build-arg JIRA_USER=$JIRA_ON_CLOUD \
            --build-arg JIRA_CLOUD_TOKEN=$JIRA_CLOUD_TOKEN \ 
            --build-arg JIRA_USER=$JIRA_USER \
            --build-arg JIRA_PASSWORD=$JIRA_PASSWORD \
            --build-arg JIRA_PROJECT=$JIRA_PROJECT \
            --build-arg JIRA_URI=$JIRA_URI \
            --build-arg INPUT_JSON=$INPUT_JSON \
            --build-arg REPORT_INPUT_KEYS=$REPORT_INPUT_KEYS \
            --build-arg RUNS_ON_GITHUB=$RUNS_ON_GITHUB \
            --build-arg <rest-of-parameters> \ 
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
docker run -e JIRA_USER=$JIRA_ON_CLOUD \
            -e JIRA_CLOUD_TOKEN=$JIRA_CLOUD_TOKEN \ 
            -e JIRA_USER=$JIRA_USER \
            -e JIRA_PASSWORD=$JIRA_PASSWORD \
            -e JIRA_PROJECT=$JIRA_PROJECT \
            -e JIRA_URI=$JIRA_URI \
            -e INPUT_JSON=$INPUT_JSON \
            -e REPORT_INPUT_KEYS=$REPORT_INPUT_KEYS \
            -e RUNS_ON_GITHUB=$RUNS_ON_GITHUB \
            -e <rest-of-parameters> \
            <image_name>:<image_version>
```
