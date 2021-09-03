const core = require('@actions/core');
const fs = require('fs');
const _ = require('lodash');
const bunyan = require('bunyan');
const log = bunyan.createLogger({ name: 'actions-jira-integration' });

const utils = require('./utils/helper');
const config = require('./config/config');
const jira = require('./helpers/jira-helpers');

const INPUT_JSON = core.getInput('INPUT_JSON') || process.env.INPUT_JSON;
const REPORT_INPUT_KEYS = core.getInput('REPORT_INPUT_KEYS') || process.env.REPORT_INPUT_KEYS;
const PRIORITY_MAPPER = core.getInput('PRIORITY_MAPPER') || process.env.PRIORITY_MAPPER;
const ISSUE_LABELS_MAPPER = core.getInput('ISSUE_LABELS_MAPPER') || process.env.ISSUE_LABELS_MAPPER;
const UPLOAD_FILES = core.getInput('UPLOAD_FILES') || process.env.UPLOAD_FILES;
const UPLOAD_FILES_PATH = (core.getInput('UPLOAD_FILES_PATH') || process.env.UPLOAD_FILES_PATH) === '';

let jiraAuthHeaderValue;

const createIssue = async (file) => {
  const fileContent = fs.readFileSync(`${config.UTILS.PAYLOADS_DIR}/${file}`, 'utf8');

  // this is done here in order to handle more easily the async nature of the call
  let filesToBeUploaded = [];
  if (UPLOAD_FILES) {
    console.log(">>>>> Inside IF UPLOAD_FILES: " + UPLOAD_FILES );
    filesToBeUploaded = await utils.retrievePathFiles(UPLOAD_FILES_PATH);
  }

  return jira.createJiraIssue(jiraAuthHeaderValue, fileContent).then((jiraIssue) => {
    const jiraIssueKey = jiraIssue.body.key;
    const jiraIssueSummary = JSON.parse(fileContent).fields.summary;

    log.info(`A jira issue with the following details has been raised: ${utils.fixJiraURI(config.JIRA_CONFIG.JIRA_URI)}/browse/${jiraIssueKey}`);

    // upload the attachments to the relevant issue created
    if (UPLOAD_FILES) {
      filesToBeUploaded.forEach((file) => {
        // focus on the file name, not the file extension
        if (jiraIssueSummary.toLowerCase().includes(file.substr(0, file.indexOf('.')).toLowerCase())) {
          return jira.pushAttachment(`${UPLOAD_FILES_PATH}/${file}`, jiraIssueKey).then(() => {
            log.info(`Pushing attachment ${file} to issue ${jiraIssueKey}...`);
          });
        }
      });
    }
  });
};

const parallelIssueCreation = (files) => {
  return Promise.all(files.map(file => createIssue(file))).catch((e) => {
    log.error(`The Jira issue creation encountered the following error: ${e}`);
  });
};

const logout = async (jiraAuthHeaderValue) => {
  log.info('Attempting to logout from the existing JIRA session...');
  await jira.invalidateJiraSession(jiraAuthHeaderValue);
  log.info('JIRA session invalidated successfully!');
};

const kickOffAction = async (inputJson) => {
  const jiraSession = await jira.createJiraSession(config.JIRA_CONFIG.JIRA_USER, config.JIRA_CONFIG.JIRA_PASSWORD);
  log.info('JIRA session created successfully!');

  jiraAuthHeaderValue = await jira.createJiraSessionHeaders(jiraSession);

  const retrievedIssuesSummaries = [];

  log.info('Attempting to search for existing JIRA issues...');

  // Gather the issues that have been resolved with certain criteria
  const { body: resolvedRetrievedIssues } = await jira.searchExistingJiraIssues(jiraAuthHeaderValue, config.JIRA_CONFIG.JIRA_ISSUE_SEARCH_PAYLOAD_RESOLVED_ISSUES);
  const { issues: resolvedIssues } = resolvedRetrievedIssues;
  resolvedIssues.forEach((issue) => {
    retrievedIssuesSummaries.push(issue.fields.summary.split(' ').join(''));
  });

  // Gather the Open issues
  const { body: openRetrievedIssues } = await jira.searchExistingJiraIssues(jiraAuthHeaderValue, config.JIRA_CONFIG.JIRA_ISSUE_SEARCH_PAYLOAD_OPEN_ISSUES);
  const { issues: openIssues } = openRetrievedIssues;
  openIssues.forEach((issue) => {
    retrievedIssuesSummaries.push(issue.fields.summary.split(' ').join(''));
  });

  const retrievedIssuesUniqueSummaries = _.uniq(retrievedIssuesSummaries);

  if (resolvedIssues.length !== 0 && openIssues.length !== 0) {
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
      if (!retrievedIssuesUniqueSummaries.includes(utils.ultraTrim(reportMapperInstance.issueSummary))) {
        log.info(`Attempting to create JSON payload for module ${reportMapperInstance.issueName}...`);
        utils.amendHandleBarTemplate(
          config.UTILS.CREATE_JIRA_ISSUE_PAYLOAD_TEMPLATE,
          reportMapperInstance.issueName,
          reportMapperInstance.issueSummary,
          reportMapperInstance.issueDescription,
          reportMapperInstance.issueSeverity,
          severityMap,
          labels
        );
      } else {
        openIssues.forEach(openIssue => {
          if (utils.ultraTrim(openIssue.fields.summary) === utils.ultraTrim(reportMapperInstance.issueSummary)) {
            log.info(`The issue for ${reportMapperInstance.issueName} is already open - more details on ${utils.fixJiraURI(config.JIRA_CONFIG.JIRA_URI)}/browse/${openIssue.key}`);
          }
        });

        resolvedIssues.forEach(resolvedIssue => {
          if (utils.ultraTrim(resolvedIssue.fields.summary) === utils.ultraTrim(reportMapperInstance.issueSummary)) {
            log.info(`The issue for ${reportMapperInstance.issueName} has already been resolved - more details on ${utils.fixJiraURI(config.JIRA_CONFIG.JIRA_URI)}/browse/${resolvedIssue.key}`);
          }
        });
      }
    } else {
      log.info(`Skipping creation of module ${reportMapperInstance.issueName}`);
    }
  }

  console.log(">>>>>>>>>>>>>>>>>>>>>>> PAYLOADS_DIR: " + config.UTILS.PAYLOADS_DIR)
  const files = await utils.retrievePathFiles(config.UTILS.PAYLOADS_DIR);

  if (files.length !== 0) {
    await parallelIssueCreation(files);
  } else {
    log.info('All the vulnerabilities have already been captured as issues on Jira.');
  }

  await logout(jiraAuthHeaderValue);
};

(async () => {
  utils.folderCleanup(config.UTILS.PAYLOADS_DIR);
  await kickOffAction(INPUT_JSON);
})();
