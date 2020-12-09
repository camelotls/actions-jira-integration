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
const MOCK_JIRA_ISSUE_PRIORITY = {
  name: 'P2'
};
const MOCK_JIRA_ISSUE_LABELS = ['mock1', 'mock2'];
const MOCK_JIRA_ISSUE_DESCRIPTION = 'This is a mock description';
const MOCK_JIRA_AUTH_HEADERS = `${MOCK_JIRA_SESSION_NAME}=${MOCK_JIRA_SESSION_VALUE}`;
const MOCK_JIRA_ISSUE_CREATION_PAYLOAD = {
  fields: {
    project: {
      key: 'project'
    },
    summary: 'This is a mock',
    issuetype: {
      name: 'This is a mock security vulnerability'
    },
    priority: {
      name: 'P2'
    },
    labels: [
      'mock1',
      'mock2'
    ],
    description: 'This is a mock description'
  }
};
const MOCK_JIRA_ISSUE_SEARCH_RESPONSE = {
  expand: 'names,schema',
  startAt: 0,
  maxResults: 50,
  total: 1,
  issues: [{
    expand: '',
    id: '10001',
    self: 'http://www.example.com/jira/rest/api/2/issue/10001',
    key: 'project'
  }]
};

module.exports = {
  MOCK_LOGIN_SESSION: MOCK_LOGIN_SESSION,
  MOCK_JIRA_USER: MOCK_JIRA_USER,
  MOCK_JIRA_PASSWORD: MOCK_JIRA_PASSWORD,
  MOCK_JIRA_SESSION_NAME: MOCK_JIRA_SESSION_NAME,
  MOCK_JIRA_SESSION_VALUE: MOCK_JIRA_SESSION_VALUE,
  MOCK_JIRA_AUTH_HEADERS: MOCK_JIRA_AUTH_HEADERS,
  MOCK_JIRA_ISSUE_CREATION_PAYLOAD: MOCK_JIRA_ISSUE_CREATION_PAYLOAD,
  MOCK_JIRA_ISSUE_SEARCH_RESPONSE: MOCK_JIRA_ISSUE_SEARCH_RESPONSE,
  MOCK_JIRA_ISSUE_PROJECT_KEY: MOCK_JIRA_ISSUE_PROJECT_KEY,
  MOCK_JIRA_ISSUE_SUMMARY: MOCK_JIRA_ISSUE_SUMMARY,
  MOCK_JIRA_ISSUE_TYPE: MOCK_JIRA_ISSUE_TYPE,
  MOCK_JIRA_ISSUE_PRIORITY: MOCK_JIRA_ISSUE_PRIORITY,
  MOCK_JIRA_ISSUE_LABELS: MOCK_JIRA_ISSUE_LABELS,
  MOCK_JIRA_ISSUE_DESCRIPTION: MOCK_JIRA_ISSUE_DESCRIPTION
};
