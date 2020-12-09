const core = require('@actions/core');

const JIRA_CONFIG = {
  JIRA_PROJECT_ID: core.getInput('JIRA_PROJECT'),
  JIRA_URI: 'jira.camelot.global',
  JIRA_ISSUE_CREATION_ENDPOINT: '/rest/api/2/issue',
  JIRA_ISSUE_AUTH_SESSION_ENDPOINT: '/rest/auth/1/session',
  JIRA_ISSUE_SEARCH_ENDPOINT: '/rest/api/2/search',
  JIRA_ISSUE_SEARCH_PAYLOAD: {
    jql: `project=${core.getInput('JIRA_PROJECT')} AND type="Security Vulnerability" AND status NOT IN ("Done")`,
    startAt: 0,
    maxResults: 100,
    fields: [
      'summary'
    ]
  }
};

const REST_CONFIG = {
  HEADER_ACCEPT_APPLICATION_JSON: 'application/json'
};

const UTILS = {
  TEMPLATES_DIR: './templates',
  PAYLOADS_DIR: './payloads',
  CREATE_JIRA_ISSUE_PAYLOAD_TEMPLATE: 'issueCreation.template'
};

module.exports = {
  JIRA_CONFIG: JIRA_CONFIG,
  REST_CONFIG: REST_CONFIG,
  UTILS: UTILS
};
