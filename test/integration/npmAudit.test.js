const { expect } = require('chai');
const { describe, it, before } = require('mocha');

const { kickOffAction } = require('../../helpers/foundation');
const dockerodeFacade = require('../utils/dockerodeFacade');
const { provideEnvironment, getIssuesFromJira } = require('../utils/testEnvProvider');
const { getInput } = require('../../utils/helper');

require('dotenv').config();

const ghUsername = process.env.GITHUB_USER;
const ghToken = process.env.GITHUB_TOKEN;
const jiraEndpointTestReadyState = process.env.JIRA_ALIVE_URI;

const envVars = {
    JIRA_USER: process.env.JIRA_USER,
    JIRA_PASSWORD: process.env.JIRA_PASSWORD,
    JIRA_PROJECT: process.env.JIRA_PROJECT,
    JIRA_URI: process.env.JIRA_URI
};

describe('Jira Issues from npm audit', () => {
    before(function(done) {
        this.timeout(600000);
        provideEnvironment(envVars);

        // this is needed only when run the tests on a local machine for extra convenience
        if(getInput('GITHUB_RUN') !== 'true') {
            dockerodeFacade.stopAllContainers(done);
        }

        dockerodeFacade.pullImageAndSpawnContainer(
            done,
            // eslint-disable-next-line no-undef
            (contId) => (containerId = contId),
            { username: ghUsername, password: ghToken },
            jiraEndpointTestReadyState
        );
    });

    it('should create a Jira ticket from an npm audit report with one vulnerability', async function(done) {
        this.timeout(0);

        await kickOffAction(process.env.INPUT_JSON);

        const existingJiraIssues = await getIssuesFromJira();
        expect(existingJiraIssues).to.be.not.empty();

        done();
    });
});
