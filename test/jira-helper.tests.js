const { expect } = require('chai');
const nock = require('nock');
const { describe, it } = require('mocha');

const jira = require('../helpers/jira-helpers');
const mocks = require('./mocks/jira-helper-mock');
const config = require('../config/config');

describe('Jira REST are functioning properly', () => {
  process.env = {
    JIRA_PROJECT: mocks.MOCK_JIRA_PROJECT,
    JIRA_URI: mocks.MOCK_JIRA_URI,
    ISSUE_TYPE: mocks.MOCK_JIRA_ISSUE_TYPE_FILTER,
    JQL_SEARCH_PAYLOAD_RESOLVED_ISSUES: mocks.MOCK_JQL_SEARCH_PAYLOAD_RESOLVED_ISSUES,
    JQL_SEARCH_PAYLOAD_OPEN_ISSUES: mocks.MOCK_JQL_SEARCH_PAYLOAD_OPEN_ISSUES
  };

  let sessionPayload = '';
  let authHeaders = '';

  describe('Jira REST calls successful cases without a Load Balancer', () => {
    // eslint-disable-next-line no-undef
    before('a JIRA session can be created', async () => {
      nock(mocks.MOCK_JIRA_URI)
        .post(config.JIRA_CONFIG.JIRA_ISSUE_AUTH_SESSION_ENDPOINT)
        .reply(200, mocks.MOCK_LOGIN_SESSION);

      sessionPayload = await jira.createJiraSession(
        mocks.MOCK_JIRA_USER,
        mocks.MOCK_JIRA_PASSWORD
      );
      authHeaders = await jira.createJiraSessionHeaders(sessionPayload);

      expect(sessionPayload)
        .to.be.instanceOf(Object)
        .to.have.all.keys('sessionID', 'loadBalancerCookie');
      expect(Object.values(sessionPayload.sessionID)).to.deep.equal([
        mocks.MOCK_JIRA_SESSION_NAME,
        mocks.MOCK_JIRA_SESSION_VALUE
      ]);
      expect(Object.values(sessionPayload.loadBalancerCookie)).to.deep.equal([
        '',
        ''
      ]);
    });

    it('a JIRA session header can be constructed', async () => {
      const authName = authHeaders.substring(0, authHeaders.indexOf('='));
      const authToken = authHeaders.substring(
        authHeaders.indexOf('=') + 1,
        authHeaders.length
      );

      expect(authName).to.deep.equal(mocks.MOCK_JIRA_SESSION_NAME);
      expect(authToken).to.deep.equal(mocks.MOCK_JIRA_SESSION_VALUE);
    });

    it('a JIRA issue can be created', async () => {
      nock(mocks.MOCK_JIRA_URI)
        .post(config.JIRA_CONFIG.JIRA_ISSUE_CREATION_ENDPOINT)
        .reply(200, mocks.MOCK_JIRA_ISSUE_CREATION_PAYLOAD);

      const response = await jira.createJiraIssue(
        authHeaders,
        JSON.stringify(mocks.MOCK_JIRA_ISSUE_CREATION_PAYLOAD)
      );
      expect(response.body.fields)
        .to.be.instanceOf(Object)
        .to.have.all.keys(
          'description',
          'issuetype',
          'labels',
          'project',
          'summary'
        );
      expect(Object.values(response.body.fields)).to.deep.equal([
        mocks.MOCK_JIRA_ISSUE_PROJECT_KEY,
        mocks.MOCK_JIRA_ISSUE_SUMMARY,
        mocks.MOCK_JIRA_ISSUE_TYPE,
        mocks.MOCK_JIRA_ISSUE_LABELS,
        mocks.MOCK_JIRA_ISSUE_DESCRIPTION
      ]);
    });

    it('a JIRA issue with extra field can be created', async () => {
      nock(mocks.MOCK_JIRA_URI)
        .post(config.JIRA_CONFIG.JIRA_ISSUE_CREATION_ENDPOINT)
        .reply(200, mocks.MOCK_JIRA_ISSUE_WITH_EXTRA_FIELD_CREATION_PAYLOAD);

      const response = await jira.createJiraIssue(
        authHeaders,
        JSON.stringify(mocks.MOCK_JIRA_ISSUE_WITH_EXTRA_FIELD_CREATION_PAYLOAD)
      );
      expect(response.body.fields)
        .to.be.instanceOf(Object)
        .to.have.all.keys(
          'description',
          'issuetype',
          'labels',
          'project',
          'summary',
          'components'
        );
      expect(Object.values(response.body.fields)).to.deep.equal([
        mocks.MOCK_JIRA_ISSUE_PROJECT_KEY,
        mocks.MOCK_JIRA_ISSUE_SUMMARY,
        mocks.MOCK_JIRA_ISSUE_TYPE,
        mocks.MOCK_JIRA_ISSUE_LABELS,
        mocks.MOCK_JIRA_ISSUE_DESCRIPTION,
        mocks.MOCK_JIRA_ISSUE_EXTRA_FIELD_KEY
      ]);
    });

    it('a list of JIRA issues can be queried', async () => {
      nock(mocks.MOCK_JIRA_URI)
        .post(config.JIRA_CONFIG.JIRA_ISSUE_SEARCH_ENDPOINT)
        .reply(200, mocks.MOCK_JIRA_ISSUE_SEARCH_RESPONSE);

      const response = await jira.searchExistingJiraIssues(authHeaders, config.JIRA_CONFIG.JIRA_ISSUE_SEARCH_PAYLOAD_OPEN_ISSUES);
      expect(response.body)
        .to.be.instanceOf(Object)
        .to.have.all.keys('expand', 'startAt', 'maxResults', 'total', 'issues');
    });

    it('a list of JIRA resolved issues can be queried', async () => {
      nock(mocks.MOCK_JIRA_URI)
        .post(config.JIRA_CONFIG.JIRA_ISSUE_SEARCH_ENDPOINT)
        .reply(200, mocks.MOCK_JIRA_ISSUE_SEARCH_RESPONSE);

      const response = await jira.searchExistingJiraIssues(authHeaders, config.JIRA_CONFIG.JIRA_ISSUE_SEARCH_PAYLOAD_OPEN_ISSUES);
      expect(response.body)
        .to.be.instanceOf(Object)
        .to.have.all.keys('expand', 'startAt', 'maxResults', 'total', 'issues');
    });

    it('a list of JIRA issues without a supplied jql query can be queried', async () => {
      process.env.JQL_SEARCH_PAYLOAD_OPEN_ISSUES = mocks.MOCK_JQL_SEARCH_PAYLOAD_OPEN_ISSUES_EMPTY;
      process.env.JQL_SEARCH_PAYLOAD_RESOLVED_ISSUES = mocks.MOCK_JQL_SEARCH_PAYLOAD_RESOLVED_ISSUES_EMPTY;

      nock(mocks.MOCK_JIRA_URI)
        .post(config.JIRA_CONFIG.JIRA_ISSUE_SEARCH_ENDPOINT)
        .reply(200, mocks.MOCK_JIRA_ISSUE_SEARCH_RESPONSE);

      const response = await jira.searchExistingJiraIssues(authHeaders, config.JIRA_CONFIG.JIRA_ISSUE_SEARCH_PAYLOAD_OPEN_ISSUES);
      expect(response.body)
        .to.be.instanceOf(Object)
        .to.have.all.keys('expand', 'startAt', 'maxResults', 'total', 'issues');
    });

    it('a JIRA session can be invalidated', async () => {
      nock(mocks.MOCK_JIRA_URI)
        .delete(config.JIRA_CONFIG.JIRA_ISSUE_AUTH_SESSION_ENDPOINT)
        .reply(204, '');

      const response = await jira.invalidateJiraSession(authHeaders);
      expect(response).to.be.equal('');
    });

    // eslint-disable-next-line no-undef
    after('Clean up mocks', async () => {
      nock.cleanAll();
    });
  });

  // Jira REST calls successful cases with a Load Balancer is out of scope of the unit tests, since we need to mock the LB behaviour

  describe('Jira REST calls unsuccessful cases', () => {
    const authHeaders = '';
    process.env = {
      JIRA_PROJECT: mocks.MOCK_JIRA_PROJECT,
      JIRA_URI: mocks.MOCK_JIRA_URI,
      ISSUE_TYPE: mocks.MOCK_JIRA_ISSUE_TYPE_FILTER
    };

    it('a JIRA session fails to be created when the Jira URI is invalid', async () => {
      return jira
        .createJiraSession(mocks.MOCK_JIRA_USER, mocks.MOCK_JIRA_PASSWORD)
        .then(
          () =>
            Promise.reject(
              new Error(
                `POST request createJiraSession encountered the following error: getaddrinfo ENOTFOUND ${process.env.JIRA_URI}`
              )
            ),
          (error) => expect(error).to.be.an.instanceof(Error)
        );
    });

    it('a JIRA issue fails to be created when a wrong payload is supplied', async () => {
      nock(mocks.MOCK_JIRA_URI)
        .post(config.JIRA_CONFIG.JIRA_ISSUE_CREATION_ENDPOINT)
        .reply(400, mocks.MOCK_JIRA_ISSUE_CREATION_WRONG_RESPONSE);

      const error = await jira.createJiraIssue(
        authHeaders,
        JSON.stringify(mocks.MOCK_JIRA_ISSUE_CREATION_WRONG_PAYLOAD)
      );
      expect(error.response.statusCode).to.be.equal(400);
      expect(error.response.body)
        .to.be.instanceOf(Object)
        .to.have.all.keys('errorMessages', 'errors');
    });

    it('a JIRA issue fails to be created when a wrong extra field is supplied', async () => {
      nock(mocks.MOCK_JIRA_URI)
        .post(config.JIRA_CONFIG.JIRA_ISSUE_CREATION_ENDPOINT)
        .reply(400, mocks.MOCK_JIRA_ISSUE_CREATION_WRONG_RESPONSE);

      const error = await jira.createJiraIssue(
        authHeaders,
        JSON.stringify(mocks.MOCK_JIRA_ISSUE_WITH_WRONG_EXTRA_FIELD_CREATION_PAYLOAD)
      );
      expect(error.response.statusCode).to.be.equal(400);
      expect(error.response.body)
        .to.be.instanceOf(Object)
        .to.have.all.keys('errorMessages', 'errors');
    });

    it('a list of JIRA issues fails to be fetched when a wrong payload is supplied', async () => {
      nock(mocks.MOCK_JIRA_URI)
        .post(config.JIRA_CONFIG.JIRA_ISSUE_SEARCH_ENDPOINT)
        .reply(400, mocks.MOCK_JIRA_ISSUE_WRONG_SEARCH_RESPONSE);

      const error = await jira.searchExistingJiraIssues(authHeaders, config.JIRA_CONFIG.JIRA_ISSUE_SEARCH_PAYLOAD_OPEN_ISSUES);
      expect(error.response.body)
        .to.be.instanceOf(Object)
        .to.have.all.keys('errorMessages', 'errors');
    });

    // eslint-disable-next-line no-undef
    after('Clean up mocks', async () => {
      nock.cleanAll();
    });
  });
});
