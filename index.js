const core = require('@actions/core');
const fs = require('fs');
const _ = require('lodash');
const bunyan = require('bunyan');
const log = bunyan.createLogger({ name: 'actions-jira-integration' });

const utils = require('./utils/helper');
const config = require('./config/config');
const jira = require('./helpers/jira-helpers');

const INPUT_JSON = core.getInput('INPUT_JSON') || process.env.INPUT_JSON;
const JIRA_USER = core.getInput('JIRA_USER') || process.env.JIRA_USER;
const JIRA_PASSWORD = core.getInput('JIRA_PASSWORD') || process.env.JIRA_PASSWORD;
const REPORT_INPUT_KEYS = core.getInput('REPORT_INPUT_KEYS') || process.env.REPORT_INPUT_KEYS;
const PRIORITY_MAPPER = core.getInput('PRIORITY_MAPPER') || process.env.PRIORITY_MAPPER;
const ISSUE_LABELS_MAPPER = core.getInput('ISSUE_LABELS_MAPPER') || process.env.ISSUE_LABELS_MAPPER;

const startAction = async (inputJson) => {
  const jiraSession = await jira.createJiraSession(JIRA_USER, JIRA_PASSWORD);
  log.info('JIRA session created successfully!');

  const jiraAuthHeaderValue = await jira.createJiraSessionHeaders(jiraSession);

  log.info('Attempting to search for existing JIRA issues...');
  const { body: retrievedIssues } = await jira.searchExistingJiraIssues(
    jiraAuthHeaderValue
  );
  const { issues } = retrievedIssues;
  const retrievedIssuesSummaries = [];

  issues.forEach((issue) => {
    retrievedIssuesSummaries.push(issue.fields.summary);
  });

  if (issues.length !== 0) {
    log.info('Existing JIRA issues retrieved successfully!');
  }

  const priorityMapper = new Map(
    Object.entries(utils.populateMap(PRIORITY_MAPPER))
  );
  const reportPairsMapper = utils.populateMap(REPORT_INPUT_KEYS);
  const labels =
    ISSUE_LABELS_MAPPER.length !== 0
      ? { labels: ISSUE_LABELS_MAPPER.split(',') }
      : { labels: [] };

  const parsedInput = JSON.parse(inputJson);
  for (const inputElement in parsedInput) {
    const reportMapperInstance = utils.reportMapper(
      inputElement,
      parsedInput,
      reportPairsMapper
    );
    const severityMap = priorityMapper.get(reportMapperInstance.issueSeverity);
    if (severityMap !== undefined) {
      if (
        !retrievedIssuesSummaries.includes(reportMapperInstance.issueSummary) &&
        !_.isEmpty(retrievedIssuesSummaries)
      ) {
        log.info(`Attempting to create json payload for module ${reportMapperInstance.vulnerabilityName}...`);
        utils.amendHandleBarTemplate(
          config.UTILS.CREATE_JIRA_ISSUE_PAYLOAD_TEMPLATE,
          reportMapperInstance.vulnerabilityName,
          reportMapperInstance.issueSummary,
          reportMapperInstance.issueDescription,
          reportMapperInstance.issueSeverity,
          severityMap,
          labels
        );
      } else {
        const existingIssueKey =
          issues[
            retrievedIssuesSummaries.indexOf(reportMapperInstance.issueSummary)
          ].key;
        log.info(`Issue for ${reportMapperInstance.issueSummary} has already been raised - More details on https://${config.JIRA_CONFIG.JIRA_URI}/browse/${existingIssueKey}`);
      }
    } else {
      log.info(`Skipping creation of module ${reportMapperInstance.vulnerabilityName}`);
    }
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
      log.info(`Attempting to create JIRA issue based on payload ${file}...`);
      const jiraIssue = await jira.createJiraIssue(
        jiraAuthHeaderValue,
        fs.readFileSync(`${config.UTILS.PAYLOADS_DIR}/${file}`, 'utf8')
      );
      log.info(`Jira issue created: ${jiraIssue.body}`);
    });
  } else {
    log.info(
      'All the vulnerabilities have already been captured as issues on Jira.'
    );
  }

  log.info('Attempting to logout from the existing JIRA session...');
  await jira.invalidateJiraSession(jiraAuthHeaderValue);
  log.info('JIRA session invalidated successfully!');
};

(async () => {
  utils.folderCleanup(config.UTILS.PAYLOADS_DIR);
  await startAction(INPUT_JSON);
})();
