export const MOCK_LOGIN_SESSION = {
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
export const MOCK_JIRA_URI = 'https://jira.organisation.global';
export const MOCK_JIRA_PROJECT = 'project';
export const MOCK_JIRA_USER = 'user';
export const MOCK_JIRA_PASSWORD = '1234567';
export const MOCK_JIRA_SESSION_NAME = 'JSESSIONID';
export const MOCK_JIRA_SESSION_VALUE = '12345678901234567890';
export const MOCK_JIRA_ISSUE_PROJECT_KEY = {
  key: 'project'
};
export const MOCK_JIRA_ISSUE_SUMMARY = 'This is a mock';
export const MOCK_JIRA_ISSUE_TYPE = {
  name: 'This is a mock security vulnerability'
};
export const MOCK_JIRA_ISSUE_LABELS = ['mock1', 'mock2'];
export const MOCK_JIRA_ISSUE_DESCRIPTION = 'This is a mock description';
export const MOCK_JIRA_ISSUE_EXTRA_FIELD_KEY = [
  { id: 'This is a mock component' },
  { id: 'This is another mock component' }]
;
export const MOCK_JIRA_ISSUE_CREATION_PAYLOAD = {
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
export const MOCK_JIRA_ISSUE_WITH_EXTRA_FIELD_CREATION_PAYLOAD = {
  fields: {
    project: {
      key: 'project'
    },
    summary: 'This is a mock',
    issuetype: {
      name: 'This is a mock security vulnerability'
    },
    labels: ['mock1', 'mock2'],
    description: 'This is a mock description',
    components: [{ id: 'This is a mock component' }, { id: 'This is another mock component' }]
  }
};

export const MOCK_JIRA_ISSUE_WITH_WRONG_EXTRA_FIELD_CREATION_PAYLOAD = {
  fields: {
    project: {
      key: 'project'
    },
    summary: 'This is a mock',
    issuetype: {
      name: 'This is a mock security vulnerability'
    },
    labels: ['mock1', 'mock2'],
    description: 'This is a mock description',
    nonExistingKey: 'What is this?'
  }
};
export const MOCK_JIRA_ISSUE_CREATION_WRONG_PAYLOAD = {
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
export const MOCK_JIRA_ISSUE_CREATION_WRONG_RESPONSE = {
  errorMessages: ["Field 'priority' is required"],
  errors: {}
};
export const MOCK_JIRA_ISSUE_CREATION_WRONG_RESPONSE_WITH_WRONG_EXTRA_FIELD = {
  errorMessages: ["Field 'nonExistingKey' is not valid"],
  errors: {}
};
export const MOCK_JIRA_ISSUE_SEARCH_RESPONSE = {
  isLast: true,
  issues: [
    {
      expand: '',
      id: '10001',
      self: 'http://www.example.com/jira/rest/api/2/issue/10001',
      key: 'project'
    }
  ]
};
export const MOCK_JIRA_ISSUE_TYPE_FILTER = 'Security Vulnerability';
export const MOCK_JIRA_ISSUE_WRONG_SEARCH_RESPONSE = {
  errorMessages: ["Field 'priority' is required"],
  errors: {}
};
export const MOCK_JIRA_ISSUE_RESOLUTION_STATUS = 'Done';
export const MOCK_JIRA_ISSUE_RESOLUTION = 'Obsolete';
export const MOCK_JQL_SEARCH_PAYLOAD_RESOLVED_ISSUES = `project=${MOCK_JIRA_PROJECT} AND type="${MOCK_JIRA_ISSUE_TYPE}" AND labels IN ("${MOCK_JIRA_ISSUE_LABELS}") AND status="${MOCK_JIRA_ISSUE_RESOLUTION_STATUS}" AND resolution IN (${MOCK_JIRA_ISSUE_RESOLUTION})`;
export const MOCK_JQL_SEARCH_PAYLOAD_OPEN_ISSUES = `project=${MOCK_JIRA_PROJECT} AND type="${MOCK_JIRA_ISSUE_TYPE}" AND labels IN ("${MOCK_JIRA_ISSUE_LABELS}") AND status NOT IN ("${MOCK_JIRA_ISSUE_RESOLUTION_STATUS}")`;
export const MOCK_JQL_SEARCH_PAYLOAD_RESOLVED_ISSUES_EMPTY = '';
export const MOCK_JQL_SEARCH_PAYLOAD_OPEN_ISSUES_EMPTY = '';
