const rest = require('./rest-helper');
const config = require('../config/config');
const assert = require('assert');

const createJiraSession = async (jiraUser, jiraPassword) => {
    let sessionPayload = {
        username: jiraUser,
        password: jiraPassword
    };

    let response = await rest.POSTRequestWrapper(
        'createJiraSession',
        config.JIRA_CONFIG.JIRA_URI,
        config.JIRA_CONFIG.JIRA_ISSUE_AUTH_SESSION_ENDPOINT,
        config.REST_CONFIG.HEADER_ACCEPT_APPLICATION_JSON,
        '',
        sessionPayload
    );

    assert.strictEqual(response.statusCode, 200, `Response code is ${response.statusCode} and not 200`);

    return JSON.parse(response.body).session;
};

const createJiraSessionHeaders = (sessionPayload) => {
    let authHeaderValue = `${sessionPayload.name}=${sessionPayload.value}`;

    return authHeaderValue;
}

const createJiraIssue = async (authHeaders, filePayload) => {
    let issueRequestPayload = JSON.parse(filePayload);
    let response = await rest.POSTRequestWrapper(
        'createJiraIssue',
        config.JIRA_CONFIG.JIRA_URI,
        config.JIRA_CONFIG.JIRA_ISSUE_CREATION_ENDPOINT,
        config.REST_CONFIG.HEADER_ACCEPT_APPLICATION_JSON,
        authHeaders,
        issueRequestPayload
    );

    return response;
};

const searchExistingJiraIssues = async (authHeaders) => {
    let response = await rest.POSTRequestWrapper(
        'searchExistingJiraIssues',
        config.JIRA_CONFIG.JIRA_URI,
        config.JIRA_CONFIG.JIRA_ISSUE_SEARCH_ENDPOINT,
        config.REST_CONFIG.HEADER_ACCEPT_APPLICATION_JSON,
        authHeaders,
        config.JIRA_CONFIG.JIRA_ISSUE_SEARCH_PAYLOAD
    );

    return response.body;
};

const invalidateJiraSession = async (authHeaders) => {
    let response = await rest.DELETERequestWrapper(
        'invalidateJiraSession',
        config.JIRA_CONFIG.JIRA_URI,
        config.JIRA_CONFIG.JIRA_ISSUE_AUTH_SESSION_ENDPOINT,
        config.REST_CONFIG.HEADER_ACCEPT_APPLICATION_JSON,
        authHeaders
    );

    assert.strictEqual(response.statusCode, 204, `Response code is ${response.statusCode} and not 204`);

    return response.body;
}

module.exports = {
    createJiraIssue: createJiraIssue,
    createJiraSession: createJiraSession,
    createJiraSessionHeaders: createJiraSessionHeaders,
    searchExistingJiraIssues: searchExistingJiraIssues,
    invalidateJiraSession: invalidateJiraSession,
};
