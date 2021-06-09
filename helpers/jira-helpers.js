const assert = require('assert');
const core = require('@actions/core');

const rest = require('./rest-helper');
const config = require('../config/config');

const createJiraSession = async function createJiraSession (
  jiraUser,
  jiraPassword
) {
  const LOAD_BALANCER_COOKIE_ENABLED = core.getInput('LOAD_BALANCER_COOKIE_ENABLED') === 'true' || process.env.LOAD_BALANCER_COOKIE_ENABLED === 'true';
  const LOAD_BALANCER_COOKIE_NAME = core.getInput('LOAD_BALANCER_COOKIE_NAME') || process.env.LOAD_BALANCER_COOKIE_NAME || '';

  const sessionPayload = {
    username: jiraUser,
    password: jiraPassword
  };

  const response = await rest.POSTRequestWrapper(
    createJiraSession.name,
    process.env.JIRA_URI || config.JIRA_CONFIG.JIRA_URI,
    config.JIRA_CONFIG.JIRA_ISSUE_AUTH_SESSION_ENDPOINT,
    config.REST_CONFIG.HEADER_ACCEPT_APPLICATION_JSON,
    '',
    sessionPayload
  );

  assert(
    response.statusCode === 200,
    `Jira session cannot be created: ${response.message}`
  );

  const SESSION_PAYLOAD = {
    sessionID: {
      name: response.body.session.name,
      value: response.body.session.value
    },
    loadBalancerCookie: {
      name: '',
      value: ''
    }
  };

  if (LOAD_BALANCER_COOKIE_ENABLED) {
    const LOAD_BALANCER = response.headers['set-cookie'][0];
    const LOAD_BALANCER_HEADER = `${LOAD_BALANCER_COOKIE_NAME}=`;
    const LOAD_BALANCER_HEADER_LENGTH = LOAD_BALANCER.indexOf(LOAD_BALANCER_HEADER) + LOAD_BALANCER_HEADER.length;

    Object.assign(SESSION_PAYLOAD.loadBalancerCookie, {
      name: LOAD_BALANCER_HEADER,
      value: LOAD_BALANCER.toString().substring(
        LOAD_BALANCER_HEADER_LENGTH,
        LOAD_BALANCER_HEADER_LENGTH + LOAD_BALANCER.indexOf(';') - 7
      )
    });
  }

  return SESSION_PAYLOAD;
};

const createJiraSessionHeaders = (sessionPayload) => {
  const authHeaderJiraCookieValue = `${sessionPayload.sessionID.name}=${sessionPayload.sessionID.value}`;
  const authHeaderCookieValues =
    sessionPayload.loadBalancerCookie.name === ''
      ? authHeaderJiraCookieValue
      : `${authHeaderJiraCookieValue};${sessionPayload.loadBalancerCookie.name}${sessionPayload.loadBalancerCookie.value}`;

  return authHeaderCookieValues;
};

const createJiraIssue = async function (authHeaders, filePayload) {
  const issueRequestPayload = JSON.parse(filePayload);
  const response = await rest.POSTRequestWrapper(
    createJiraIssue.name,
    process.env.JIRA_URI || config.JIRA_CONFIG.JIRA_URI,
    config.JIRA_CONFIG.JIRA_ISSUE_CREATION_ENDPOINT,
    config.REST_CONFIG.HEADER_ACCEPT_APPLICATION_JSON,
    authHeaders,
    issueRequestPayload
  );

  return response;
};

const searchExistingJiraIssues = async function (authHeaders) {
  const response = await rest.POSTRequestWrapper(
    searchExistingJiraIssues.name,
    process.env.JIRA_URI || config.JIRA_CONFIG.JIRA_URI,
    config.JIRA_CONFIG.JIRA_ISSUE_SEARCH_ENDPOINT,
    config.REST_CONFIG.HEADER_ACCEPT_APPLICATION_JSON,
    authHeaders,
    config.JIRA_CONFIG.JIRA_ISSUE_SEARCH_PAYLOAD
  );

  return response;
};

const invalidateJiraSession = async function (authHeaders) {
  const response = await rest.DELETERequestWrapper(
    invalidateJiraSession.name,
    process.env.JIRA_URI || config.JIRA_CONFIG.JIRA_URI,
    config.JIRA_CONFIG.JIRA_ISSUE_AUTH_SESSION_ENDPOINT,
    config.REST_CONFIG.HEADER_ACCEPT_APPLICATION_JSON,
    authHeaders
  );

  return response.body;
};

module.exports = {
  createJiraIssue: createJiraIssue,
  createJiraSession: createJiraSession,
  createJiraSessionHeaders: createJiraSessionHeaders,
  searchExistingJiraIssues: searchExistingJiraIssues,
  invalidateJiraSession: invalidateJiraSession
};
