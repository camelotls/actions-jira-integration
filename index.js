const core = require('@actions/core');
const fs = require('fs');

const utils = require('./utils/helper');
const config = require('./config/config');
const jira = require('./helpers/jira-helpers');
const jsonParser = require('./utils/jsonParserFactory');

const INPUT_JSON = core.getInput('INPUT_JSON');
const TOOL_NAME = core.getInput('TOOL_NAME');
const JIRA_USER = core.getInput('JIRA_USER');
const JIRA_PASSWORD = core.getInput('JIRA_PASSWORD');

const startAction = async (inputJson, toolName) => {
  const jiraSession = await jira.createJiraSession(JIRA_USER, JIRA_PASSWORD);
  console.log('JIRA session created successfully!');

  const jiraAuthHeaderValue = await jira.createJiraSessionHeaders(jiraSession);

  console.log('Attempting to search for existing JIRA issues...');
  const retrievedIssues = await jira.searchExistingJiraIssues(jiraAuthHeaderValue);
  const { issues } = JSON.parse(retrievedIssues);
  const retrievedIssuesSummaries = [];

  issues.forEach(issue => {
    retrievedIssuesSummaries.push(issue.fields.summary);
  });

  if (issues.length !== 0) {
    console.log('Existing JIRA issues retrieved successfully!');
  }

  let inputParser = {};
  switch (toolName) {
    case 'NpmAudit': {
      const npmInput = JSON.parse(inputJson).advisories;
      for (const advisoryId in npmInput) {
        inputParser = jsonParser.createParser('NpmAudit', npmInput, advisoryId);

        const issueModule = inputParser.module_name;
        const issueSummary = `npm-audit: ${issueModule} module vulnerability`;
        const recommendation = inputParser.recommendation;
        const cwe = inputParser.cwe;
        const vulnerableVersions = inputParser.vulnerable_versions;
        const patchedVersions = inputParser.patched_versions;
        const overview = inputParser.overview;
        // we do that to achieve the correct format in the payload sent for the issue creation
        const overviewEdited = overview.slice(0, overview.lastIndexOf('.')).replace(/\n/g, '');
        const url = inputParser.url;
        const issueDescription = `*Recommendation*:\\n\\n${recommendation}\\n\\n*Details for ${cwe}*\\n\\n_Vulnerable versions_:\\n\\n${vulnerableVersions}\\n\\n_Patched versions_:\\n\\n${patchedVersions}\\n\\n*Overview*\\n\\n${overviewEdited}\\n\\n*References*\\n\\n${url}\\n`;
        const issueSeverity = utils.jiraPriorityMapper(inputParser.severity);

        console.log(overviewEdited);

        if (!retrievedIssuesSummaries.includes(issueSummary)) {
          console.log(`Attempting to create json payload for module ${issueModule}...`);
          utils.amendHandleBarTemplate(
            config.UTILS.CREATE_JIRA_ISSUE_PAYLOAD_TEMPLATE,
            inputParser.module_name,
            issueSummary,
            issueDescription,
            issueSeverity
          );
        } else {
          const existingIssueKey = issues[retrievedIssuesSummaries.indexOf(issueSummary)].key;
          console.log(`Issue for ${issueSummary} has already been raised - More details on https://${config.JIRA_CONFIG.JIRA_URI}/browse/${existingIssueKey}`);
        }
      }
      break;
    }
    default:
      console.log(`${toolName} parser hasn't been implemented yet!`);
      break;
  }

  let files = [];
  try {
    files = await fs.promises.readdir(config.UTILS.PAYLOADS_DIR);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }

  if (files.length !== 0) {
    await files.forEach(async (file) => {
      console.log(`Attempting to create JIRA issue based on payload ${file}...`);
      const jiraIssue = await jira.createJiraIssue(jiraAuthHeaderValue, fs.readFileSync(`${config.UTILS.PAYLOADS_DIR}/${file}`, 'utf8'));
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
  utils.folderCleanup(config.UTILS.PAYLOADS_DIR);
  await startAction(INPUT_JSON, TOOL_NAME);
})();
