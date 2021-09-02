const core = require('@actions/core');

const JIRA_CONFIG = {
  get: () => {
    return {
      JIRA_PROJECT: process.env.JIRA_PROJECT || core.getInput('JIRA_PROJECT'),
      JIRA_URI: process.env.JIRA_URI || core.getInput('JIRA_URI'),
      JIRA_ISSUE_TYPE: process.env.JIRA_ISSUE_TYPE || core.getInput('JIRA_ISSUE_TYPE'),
      JIRA_ISSUE_CREATION_ENDPOINT: '/rest/api/2/issue',
      JIRA_ISSUE_AUTH_SESSION_ENDPOINT: '/rest/auth/1/session',
      JIRA_ISSUE_SEARCH_ENDPOINT: '/rest/api/2/search',
      JIRA_ISSUE_SEARCH_PAYLOAD: {
        jql: `project=${process.env.JIRA_PROJECT || core.getInput('JIRA_PROJECT')} AND type="${process.env.JIRA_ISSUE_TYPE || core.getInput('JIRA_ISSUE_TYPE')}" AND status NOT IN ("Done")`,
        startAt: 0,
        maxResults: 100,
        fields: [
          'summary'
        ]
      }
    };
  }
};

const REST_CONFIG = {
  HEADER_ACCEPT_APPLICATION_JSON: 'application/json'
};

const UTILS = {
  TEMPLATES_DIR: (process.env.RUNS_ON_GITHUB || core.getInput('RUNS_ON_GITHUB')) === 'true' ? './actions-jira-integration/templates' : './templates',
  PAYLOADS_DIR: (process.env.RUNS_ON_GITHUB || core.getInput('RUNS_ON_GITHUB')) === 'true' ? './actions-jira-integration/payloads' : './payloads',
  CREATE_JIRA_ISSUE_PAYLOAD_TEMPLATE: 'issueCreation.template'
};

module.exports = {
  JIRA_CONFIG: JIRA_CONFIG,
  REST_CONFIG: REST_CONFIG,
  UTILS: UTILS
};
