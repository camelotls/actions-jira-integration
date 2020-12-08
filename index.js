const core = require('@actions/core');
const fs = require('fs');

const utils = require('./utils/helper');
const config = require('./config/config');
const jira = require('./helpers/jira-helpers');

const REJECTION_FLAG = 'npm ERR! code ELOCKVERIFY';
const INPUT_JSON = core.getInput('INPUT_JSON');
const JIRA_USER = core.getInput('JIRA_USER');
const JIRA_PASSWORD = core.getInput('JIRA_PASSWORD');

const startAction = async (report) => {
    let jiraSession = await jira.createJiraSession(JIRA_USER, JIRA_PASSWORD);
    console.log('JIRA session created successfully!');

    let jiraAuthHeaderValue = await jira.createJiraSessionHeaders(jiraSession);

    console.log('Attempting to search for existing JIRA issues...');
    let retrievedIssues = await jira.searchExistingJiraIssues(jiraAuthHeaderValue);
    let { issues } = JSON.parse(retrievedIssues);
    let retrievedIssuesSummaries = [];

    issues.forEach(issue => {
        retrievedIssuesSummaries.push(issue.fields.summary);
    });

    if (issues.length !==0) {
        console.log('Existing JIRA issues retrieved successfully!');
    }

    for (let advisoryId in JSON.parse(report).advisories) {
        let issueModule = utils.npmAuditReportParser(report, advisoryId).moduleName;
        let issueSummary = `npm-audit: ${issueModule} module vulnerability`;
        let recommendation = utils.npmAuditReportParser(report, advisoryId).recommendation;
        let cwe = utils.npmAuditReportParser(report, advisoryId).cwe;
        let vulnerableVersions = utils.npmAuditReportParser(report, advisoryId).vulnerableVersions;
        let patchedVersions = utils.npmAuditReportParser(report, advisoryId).patchedVersions;
        let overview = utils.npmAuditReportParser(report, advisoryId).overview;
        // we do that to achieve the correct format in the payload sent for the issue creation
        let overviewEdited = overview.slice(0, overview.lastIndexOf('.')).replace(/\n/g, '');
        let url = utils.npmAuditReportParser(report, advisoryId).url;
        let issueDescription = `*Recommendation*:\\n\\n${recommendation}\\n\\n*Details for ${cwe}*\\n\\n_Vulnerable versions_:\\n\\n${vulnerableVersions}\\n\\n_Patched versions_:\\n\\n${patchedVersions}\\n\\n*Overview*\\n\\n${overviewEdited}\\n\\n*References*\\n\\n${url}\\n`;
        let issueSeverity = utils.jiraPriorityMapper(utils.npmAuditReportParser(report, advisoryId).severity);

        // construct the payload only if the issue doesn't exist
        if (!retrievedIssuesSummaries.includes(issueSummary)) {
            console.log(`Attempting to create json payload for module ${issueModule}...`);
            utils.amendHandleBarTemplate(
                config.UTILS.CREATE_JIRA_ISSUE_PAYLOAD_TEMPLATE,
                issueModule,
                issueSummary,
                issueDescription,
                issueSeverity
            );
        } else {
            let existingIssueKey = issues[retrievedIssuesSummaries.indexOf(issueSummary)].key;
            console.log(`Issue for ${issueSummary} has already been raised - More details on https://${config.JIRA_CONFIG.JIRA_URI}/browse/${existingIssueKey}`);
        }
    }

    let files = [];
    try {
        files = await fs.promises.readdir(config.UTILS.PAYLOADS_DIR);
    }
    catch(e) {
        console.error(e);
        process.exit(1);
    }

    if (files.length !== 0) {
        await files.forEach(async (file) => {
            console.log(`Attempting to create JIRA issue based on payload ${file}...`);
            let jiraIssue = await jira.createJiraIssue(jiraAuthHeaderValue, fs.readFileSync(`${config.UTILS.PAYLOADS_DIR}/${file}`, 'utf8'));
            console.log(`Jira issue created: ${jiraIssue.body}`);
        });
    } else {
        console.log('All the vulnerabilities have already been captured as issues on Jira.');
    }

    console.log('Attempting to logout from the existing JIRA session...');
    await jira.invalidateJiraSession(jiraAuthHeaderValue);
    console.log('JIRA session invalidated successfully!');
};


(async () => {
    if (utils.validInput(INPUT_JSON, REJECTION_FLAG)) {
        utils.folderCleanup(config.UTILS.PAYLOADS_DIR);
        await startAction(INPUT_JSON);
    } else {
        console.log('Cannot proceeed with the Jira issue creation since the audit report output is not valid! - Exiting...');
        process.exit(1);
    }
})();
