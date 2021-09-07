const MOCK_LOGIN_SESSION = {
  session: {
    name: 'JSESSIONID',
    value: '12345678901234567890'
  },
  loginInfo: {
    failedLoginCount: 10,
    loginCount: 127,
    lastFailedLoginTime: '2019-11-08T11:54:09.993+0000',
    previousLoginTime: '2019-11-08T11:54:09.993+0000'
  }
};
const MOCK_JIRA_URI = 'https://jira.organisation.global';
const MOCK_JIRA_PROJECT = 'project';
const MOCK_JIRA_USER = 'user';
const MOCK_JIRA_PASSWORD = '1234567';
const MOCK_JIRA_SESSION_NAME = 'JSESSIONID';
const MOCK_JIRA_SESSION_VALUE = '12345678901234567890';
const MOCK_JIRA_ISSUE_PROJECT_KEY = {
  key: 'project'
};
const MOCK_JIRA_ISSUE_SUMMARY = 'This is a mock';
const MOCK_JIRA_ISSUE_TYPE = {
  name: 'This is a mock security vulnerability'
};
const MOCK_JIRA_ISSUE_LABELS = ['mock1', 'mock2'];
const MOCK_JIRA_ISSUE_DESCRIPTION = 'This is a mock description';
const MOCK_JIRA_ISSUE_CREATION_PAYLOAD = {
  fields: {
    project: {
      key: 'project'
    },
    summary: 'This is a mock',
    issuetype: {
      name: 'This is a mock security vulnerability'
    },
    labels: ['mock1', 'mock2'],
    description: 'This is a mock description'
  }
};
const MOCK_JIRA_ISSUE_CREATION_WRONG_PAYLOAD = {
  fields: {
    project: {
      key: 'nonExistentProject'
    },
    summaries: 'This is a wrong key',
    issuetype: {
      name: 'This is a mock security vulnerability'
    },
    labels: ['mock1', 'mock2'],
    description: 'This is a mock description'
  }
};
const MOCK_JIRA_ISSUE_CREATION_WRONG_RESPONSE = {
  errorMessages: ["Field 'priority' is required"],
  errors: {}
};
const MOCK_JIRA_ISSUE_SEARCH_RESPONSE = {
  expand: 'names,schema',
  startAt: 0,
  maxResults: 50,
  total: 1,
  issues: [
    {
      expand: '',
      id: '10001',
      self: 'http://www.example.com/jira/rest/api/2/issue/10001',
      key: 'project'
    }
  ]
};
const MOCK_JIRA_ISSUE_TYPE_FILTER = 'Security Vulnerability';
const MOCK_JIRA_ISSUE_WRONG_SEARCH_RESPONSE = {
  errorMessages: ["Field 'priority' is required"],
  errors: {}
};
const MOCK_JIRA_ISSUE_RESOLUTION_STATUS = 'Done';
const MOCK_JIRA_ISSUE_RESOLUTION = 'Obsolete';
const MOCK_JQL_SEARCH_PAYLOAD_RESOLVED_ISSUES = `project=${MOCK_JIRA_PROJECT} AND type="${MOCK_JIRA_ISSUE_TYPE}" AND labels IN ("${MOCK_JIRA_ISSUE_LABELS}") AND status="${MOCK_JIRA_ISSUE_RESOLUTION_STATUS}" AND resolution IN (${MOCK_JIRA_ISSUE_RESOLUTION})`;
const MOCK_JQL_SEARCH_PAYLOAD_OPEN_ISSUES = `project=${MOCK_JIRA_PROJECT} AND type="${MOCK_JIRA_ISSUE_TYPE}" AND labels IN ("${MOCK_JIRA_ISSUE_LABELS}") AND status NOT IN ("${MOCK_JIRA_ISSUE_RESOLUTION_STATUS}")`;
const MOCK_JQL_SEARCH_PAYLOAD_RESOLVED_ISSUES_EMPTY = '';
const MOCK_JQL_SEARCH_PAYLOAD_OPEN_ISSUES_EMPTY = '';

module.exports = {
  MOCK_LOGIN_SESSION: MOCK_LOGIN_SESSION,
  MOCK_JIRA_USER: MOCK_JIRA_USER,
  MOCK_JIRA_PASSWORD: MOCK_JIRA_PASSWORD,
  MOCK_JIRA_SESSION_NAME: MOCK_JIRA_SESSION_NAME,
  MOCK_JIRA_SESSION_VALUE: MOCK_JIRA_SESSION_VALUE,
  MOCK_JIRA_ISSUE_CREATION_PAYLOAD: MOCK_JIRA_ISSUE_CREATION_PAYLOAD,
  MOCK_JIRA_ISSUE_SEARCH_RESPONSE: MOCK_JIRA_ISSUE_SEARCH_RESPONSE,
  MOCK_JIRA_ISSUE_PROJECT_KEY: MOCK_JIRA_ISSUE_PROJECT_KEY,
  MOCK_JIRA_ISSUE_SUMMARY: MOCK_JIRA_ISSUE_SUMMARY,
  MOCK_JIRA_ISSUE_TYPE: MOCK_JIRA_ISSUE_TYPE,
  MOCK_JIRA_ISSUE_LABELS: MOCK_JIRA_ISSUE_LABELS,
  MOCK_JIRA_ISSUE_DESCRIPTION: MOCK_JIRA_ISSUE_DESCRIPTION,
  MOCK_JIRA_URI: MOCK_JIRA_URI,
  MOCK_JIRA_PROJECT: MOCK_JIRA_PROJECT,
  MOCK_JIRA_ISSUE_CREATION_WRONG_PAYLOAD: MOCK_JIRA_ISSUE_CREATION_WRONG_PAYLOAD,
  MOCK_JIRA_ISSUE_CREATION_WRONG_RESPONSE: MOCK_JIRA_ISSUE_CREATION_WRONG_RESPONSE,
  MOCK_JIRA_ISSUE_TYPE_FILTER: MOCK_JIRA_ISSUE_TYPE_FILTER,
  MOCK_JIRA_ISSUE_WRONG_SEARCH_RESPONSE: MOCK_JIRA_ISSUE_WRONG_SEARCH_RESPONSE,
  MOCK_JQL_SEARCH_PAYLOAD_RESOLVED_ISSUES: MOCK_JQL_SEARCH_PAYLOAD_RESOLVED_ISSUES,
  MOCK_JQL_SEARCH_PAYLOAD_OPEN_ISSUES: MOCK_JQL_SEARCH_PAYLOAD_OPEN_ISSUES,
  MOCK_JQL_SEARCH_PAYLOAD_RESOLVED_ISSUES_EMPTY: MOCK_JQL_SEARCH_PAYLOAD_RESOLVED_ISSUES_EMPTY,
  MOCK_JQL_SEARCH_PAYLOAD_OPEN_ISSUES_EMPTY: MOCK_JQL_SEARCH_PAYLOAD_OPEN_ISSUES_EMPTY
};
