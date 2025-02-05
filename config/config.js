import core from '@actions/core';

export const JIRA_CONFIG = {
  JIRA_ON_CLOUD: process.env.JIRA_ON_CLOUD || core.getInput('JIRA_ON_CLOUD'),
  JIRA_CLOUD_TOKEN: process.env.JIRA_CLOUD_TOKEN || core.getInput('JIRA_CLOUD_TOKEN'),
  JIRA_USER: process.env.JIRA_USER || core.getInput('JIRA_USER'),
  JIRA_PASSWORD: process.env.JIRA_PASSWORD || core.getInput('JIRA_PASSWORD'),
  JIRA_PROJECT: process.env.JIRA_PROJECT || core.getInput('JIRA_PROJECT'),
  JIRA_URI: process.env.JIRA_URI || core.getInput('JIRA_URI'),
  ISSUE_TYPE: process.env.ISSUE_TYPE || core.getInput('ISSUE_TYPE'),
  JIRA_ISSUE_CREATION_ENDPOINT: '/rest/api/3/issue',
  JIRA_ISSUE_AUTH_SESSION_ENDPOINT: '/rest/auth/1/session',
  JIRA_ISSUE_SEARCH_ENDPOINT: '/rest/api/3/search',
  JIRA_ISSUE_SEARCH_PAYLOAD_RESOLVED_ISSUES: {
    jql: process.env.JQL_SEARCH_PAYLOAD_RESOLVED_ISSUES || core.getInput('JQL_SEARCH_PAYLOAD_RESOLVED_ISSUES'),
    startAt: 0,
    maxResults: 1000,
    fields: [
      'summary',
      'status',
      'issuetype'
    ]
  },
  JIRA_ISSUE_SEARCH_PAYLOAD_OPEN_ISSUES: {
    jql: process.env.JQL_SEARCH_PAYLOAD_OPEN_ISSUES || core.getInput('JQL_SEARCH_PAYLOAD_OPEN_ISSUES'),
    startAt: 0,
    maxResults: 1000,
    fields: [
      'summary',
      'status',
      'issuetype'
    ]
  }
};

export const REST_CONFIG = {
  HEADER_ACCEPT_APPLICATION_JSON: 'application/json'
};

export const UTILS = {
  TEMPLATES_DIR: (core.getInput('RUNS_ON_GITHUB') || process.env.RUNS_ON_GITHUB) === 'true' ? './actions-jira-integration/templates' : './templates',
  CREATE_JIRA_ISSUE_PAYLOAD_TEMPLATE: 'issueCreation.template'
};
