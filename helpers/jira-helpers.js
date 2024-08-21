import assert from 'assert';
import core from '@actions/core';
import { DELETERequestWrapper, POSTRequestWrapper } from './rest-helper.js';
import { JIRA_CONFIG, REST_CONFIG } from '../config/config.js';
import { shellExec, fixJiraURI } from '../utils/helper.js';

export const createSession = async function createSession (
  jiraUser,
  jiraPassword
) {
  const LOAD_BALANCER_COOKIE_ENABLED = core.getInput('LOAD_BALANCER_COOKIE_ENABLED') === 'true' || process.env.LOAD_BALANCER_COOKIE_ENABLED === 'true';
  const LOAD_BALANCER_COOKIE_NAME = core.getInput('LOAD_BALANCER_COOKIE_NAME') || process.env.LOAD_BALANCER_COOKIE_NAME || '';

  const sessionPayload = {
    username: jiraUser,
    password: jiraPassword
  };

  const response = await POSTRequestWrapper(
    createSession.name,
    process.env.JIRA_URI || JIRA_CONFIG.JIRA_URI,
    JIRA_CONFIG.JIRA_ISSUE_AUTH_SESSION_ENDPOINT,
    REST_CONFIG.HEADER_ACCEPT_APPLICATION_JSON,
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

export const createSessionHeaders = (sessionPayload) => {
  const authHeaderJiraCookieValue = `${sessionPayload.sessionID.name}=${sessionPayload.sessionID.value}`;
  const authHeaderCookieValues =
    sessionPayload.loadBalancerCookie.name === ''
      ? authHeaderJiraCookieValue
      : `${authHeaderJiraCookieValue};${sessionPayload.loadBalancerCookie.name}${sessionPayload.loadBalancerCookie.value}`;

  return authHeaderCookieValues;
};

export const createIssue = async function (authHeaders, filePayload) {
  const issueRequestPayload = JSON.parse(filePayload);
  const response = await POSTRequestWrapper(
    createIssue.name,
    process.env.JIRA_URI || JIRA_CONFIG.JIRA_URI,
    JIRA_CONFIG.JIRA_ISSUE_CREATION_ENDPOINT,
    REST_CONFIG.HEADER_ACCEPT_APPLICATION_JSON,
    authHeaders,
    issueRequestPayload
  );

  return response;
};

export const searchIssues = async function (authHeaders, payload) {
  const response = await POSTRequestWrapper(
    searchIssues.name,
    process.env.JIRA_URI || JIRA_CONFIG.JIRA_URI,
    JIRA_CONFIG.JIRA_ISSUE_SEARCH_ENDPOINT,
    REST_CONFIG.HEADER_ACCEPT_APPLICATION_JSON,
    authHeaders,
    payload
  );

  return response;
};

export const invalidateSession = async function (authHeaders) {
  const response = await DELETERequestWrapper(
    invalidateSession.name,
    process.env.JIRA_URI || JIRA_CONFIG.JIRA_URI,
    JIRA_CONFIG.JIRA_ISSUE_AUTH_SESSION_ENDPOINT,
    REST_CONFIG.HEADER_ACCEPT_APPLICATION_JSON,
    authHeaders
  );

  return response.body;
};

export const pushAttachment = async function (fileName, jiraIssue) {
  shellExec(`curl -D- -u ${JIRA_CONFIG.JIRA_USER}:${JIRA_CONFIG.JIRA_PASSWORD} -X POST -H "X-Atlassian-Token: no-check" -F "file=@${fileName}" ${fixJiraURI(JIRA_CONFIG.JIRA_URI)}${JIRA_CONFIG.JIRA_ISSUE_CREATION_ENDPOINT}/${jiraIssue}/attachments`);
};
