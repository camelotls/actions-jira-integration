const core = require('@actions/core');

const JIRA_CONFIG = {
  JIRA_USER: process.env.JIRA_USER || core.getInput('JIRA_USER'),
  JIRA_PASSWORD: process.env.JIRA_PASSWORD || core.getInput('JIRA_PASSWORD'),
  JIRA_PROJECT: process.env.JIRA_PROJECT || core.getInput('JIRA_PROJECT'),
  JIRA_URI: process.env.JIRA_URI || core.getInput('JIRA_URI'),
  ISSUE_TYPE: process.env.ISSUE_TYPE || core.getInput('ISSUE_TYPE'),
  JIRA_ISSUE_CREATION_ENDPOINT: '/rest/api/2/issue',
  JIRA_ISSUE_AUTH_SESSION_ENDPOINT: '/rest/auth/1/session',
  JIRA_ISSUE_SEARCH_ENDPOINT: '/rest/api/2/search',
  JIRA_ISSUE_SEARCH_PAYLOAD_RESOLVED_ISSUES: {
    jql: process.env.JQL_SEARCH_PAYLOAD_RESOLVED_ISSUES || core.getInput('JQL_SEARCH_PAYLOAD_RESOLVED_ISSUES'),
    startAt: 0,
    maxResults: 1000,
    fields: [
      'summary'
    ]
  },
  JIRA_ISSUE_SEARCH_PAYLOAD_OPEN_ISSUES: {
    jql: process.env.JQL_SEARCH_PAYLOAD_OPEN_ISSUES || core.getInput('JQL_SEARCH_PAYLOAD_OPEN_ISSUES'),
    startAt: 0,
    maxResults: 1000,
    fields: [
      'summary'
    ]
  }
};

const REST_CONFIG = {
  HEADER_ACCEPT_APPLICATION_JSON: 'application/json'
};

const UTILS = {
  TEMPLATES_DIR: (core.getInput('RUNS_ON_GITHUB') || process.env.RUNS_ON_GITHUB) === 'true' ? './actions-jira-integration/templates' : './templates',
  CREATE_JIRA_ISSUE_PAYLOAD_TEMPLATE: 'issueCreation.template'
};

module.exports = {
  JIRA_CONFIG: JIRA_CONFIG,
  REST_CONFIG: REST_CONFIG,
  UTILS: UTILS
};
