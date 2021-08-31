const { expect } = require('chai');
const { describe, it, before, after } = require('mocha');
const rewire = require('rewire');
const index = rewire('../../index');
const dockerodeFacade = require('../utils/dockerodeFacade');
const { provideEnvironment, getIssuesFromJira, createIssueType } = require('../utils/testEnvProvider');

require('dotenv').config();

const ghUsername = process.env.GH_USER;
const ghToken = process.env.GH_TOKEN;
const jiraEndpointTestReadyState = process.env.JIRA_ALIVE_URI;

const envVars = {
  JIRA_USER: process.env.JIRA_USER,
  JIRA_PASSWORD: process.env.JIRA_PASSWORD,
  JIRA_PROJECT: process.env.JIRA_PROJECT,
  JIRA_URI: process.env.JIRA_URI
};

const kickOffAction = index.__get__('kickOffAction');

describe('Jira Issues from NPM Audit', () => {
  let containerId;

  before(function (done) {
    this.timeout(600000);
    console.time('start-cont');
    dockerodeFacade.pullImageAndSpawnContainer(
      done,
      (contId) => (containerId = contId),
      { username: ghUsername, password: ghToken },
      jiraEndpointTestReadyState
    );
    console.timeEnd('start-cont');
    provideEnvironment(envVars);
  });

  it('should create a Jira ticket from an NPM Audit report with one vulnerability', async function (done) {
    this.timeout(0);
    await createIssueType('Security Vulnerability');
    await kickOffAction(process.env.INPUT_JSON);
    const existingJiraIssues = await getIssuesFromJira();
    expect(existingJiraIssues).to.be.not.empty();
    done();
  });

  after(function (done) {
    this.timeout(180000);
    dockerodeFacade.stopAndRemoveContainer(done, containerId);
  });
});
