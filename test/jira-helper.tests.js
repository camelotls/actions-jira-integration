const { expect } = require('chai');
const nock = require('nock');
const { describe, it } = require('mocha');
const jira = require('../helpers/jira-helpers');
const mocks = require('./mocks/jira-helper-mock');
const config = require('../config/config');

describe('All the JIRA REST calls are performed correctly', () => {
  let sessionPayload = '';
  let authHeaders = '';

  // eslint-disable-next-line no-undef
  before('a JIRA session can be created', async () => {
    nock(`https://${config.JIRA_CONFIG.JIRA_URI}`)
      .post(config.JIRA_CONFIG.JIRA_ISSUE_AUTH_SESSION_ENDPOINT)
      .reply(200, mocks.MOCK_LOGIN_SESSION);

    sessionPayload = await jira.createJiraSession(mocks.MOCK_JIRA_USER, mocks.MOCK_JIRA_PASSWORD);
    authHeaders = await jira.createJiraSessionHeaders(sessionPayload);

    expect(sessionPayload).to.be.instanceOf(Object).to.have.all.keys('name', 'value');
    expect(Object.values(sessionPayload)).to.deep.equal([mocks.MOCK_JIRA_SESSION_NAME, mocks.MOCK_JIRA_SESSION_VALUE]);
  });

  it('a JIRA session header can be constructed', async () => {
    const authName = authHeaders.substring(0, authHeaders.indexOf('='));
    const authToken = authHeaders.substring(authHeaders.indexOf('=') + 1, authHeaders.length);

    expect(authName).to.deep.equal(mocks.MOCK_JIRA_SESSION_NAME);
    expect(authToken).to.deep.equal(mocks.MOCK_JIRA_SESSION_VALUE);
  });

  it('a JIRA issue can be created', async () => {
    nock(`https://${config.JIRA_CONFIG.JIRA_URI}`)
      .post(config.JIRA_CONFIG.JIRA_ISSUE_CREATION_ENDPOINT)
      .reply(200, mocks.MOCK_JIRA_ISSUE_CREATION_PAYLOAD);

    const response = await jira.createJiraIssue(authHeaders, JSON.stringify(mocks.MOCK_JIRA_ISSUE_CREATION_PAYLOAD));
    expect(JSON.parse(response.body).fields).to.be.instanceOf(Object).to.have.all.keys('description',
      'issuetype',
      'labels',
      'priority',
      'project',
      'summary');
    expect(Object.values(JSON.parse(response.body).fields)).to.deep.equal([mocks.MOCK_JIRA_ISSUE_PROJECT_KEY,
      mocks.MOCK_JIRA_ISSUE_SUMMARY,
      mocks.MOCK_JIRA_ISSUE_TYPE,
      mocks.MOCK_JIRA_ISSUE_PRIORITY,
      mocks.MOCK_JIRA_ISSUE_LABELS,
      mocks.MOCK_JIRA_ISSUE_DESCRIPTION]);
  });

  it('a list of JIRA issues can be queried', async () => {
    nock(`https://${config.JIRA_CONFIG.JIRA_URI}`)
      .post(config.JIRA_CONFIG.JIRA_ISSUE_SEARCH_ENDPOINT)
      .reply(200, mocks.MOCK_JIRA_ISSUE_SEARCH_RESPONSE);

    const response = await jira.searchExistingJiraIssues(authHeaders);
    expect(JSON.parse(response)).to.be.instanceOf(Object).to.have.all.keys('expand',
      'startAt',
      'maxResults',
      'total',
      'issues');
  });

  it('a JIRA session can be invalidated', async () => {
    nock(`https://${config.JIRA_CONFIG.JIRA_URI}`)
      .delete(config.JIRA_CONFIG.JIRA_ISSUE_AUTH_SESSION_ENDPOINT)
      .reply(204, '');

    const response = await jira.invalidateJiraSession(authHeaders);
    expect(response).to.be.equal('');
  });
});
