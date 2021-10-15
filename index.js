const core = require('@actions/core');
const _ = require('lodash');
const fs = require('fs');
const bunyan = require('bunyan');
const log = bunyan.createLogger({ name: 'actions-jira-integration' });

const utils = require('./utils/helper');
const config = require('./config/config');
const jira = require('./helpers/jira-helpers');

const REPORT_INPUT_KEYS = utils.getInput('REPORT_INPUT_KEYS');
const PRIORITY_MAPPER = utils.getInput('PRIORITY_MAPPER');
const UPLOAD_FILES = utils.getInput('UPLOAD_FILES') === 'true';
const UPLOAD_FILES_PATH = (core.getInput('UPLOAD_FILES_PATH') || process.env.UPLOAD_FILES_PATH) === '';
const EXTRA_JIRA_FIELDS = utils.getInput('EXTRA_JIRA_FIELDS');
const INPUT_JSON = fs.readFileSync(utils.getInput('INPUT_JSON'), 'utf8');

let jiraAuthHeaderValue;

const createIssue = async (payload) => {
  // this is done here in order to handle more easily the async nature of the call
  let filesToBeUploaded = [];
  if (UPLOAD_FILES) {
    filesToBeUploaded = await utils.retrievePathFiles(UPLOAD_FILES_PATH);
  }

  return jira.createIssue(jiraAuthHeaderValue, payload).then((jiraIssue) => {
    const jiraIssueKey = jiraIssue.body.key;
    const jiraIssueSummary = JSON.parse(payload).fields.summary;

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

const parallelIssueCreation = (jiraIssuesPayloads) => {
  return Promise.all(jiraIssuesPayloads.map(payload => createIssue(payload))).catch((e) => {
    log.error(`The Jira issue creation encountered the following error: ${e}`);
  });
};

const logout = async (jiraAuthHeaderValue) => {
  log.info('Attempting to logout from the existing JIRA session...');
  await jira.invalidateSession(jiraAuthHeaderValue);
  log.info('JIRA session invalidated successfully!');
};

const kickOffAction = async (inputJson) => {
  const jiraSession = await jira.createSession(config.JIRA_CONFIG.JIRA_USER, config.JIRA_CONFIG.JIRA_PASSWORD);
  log.info('JIRA session created successfully!');

  jiraAuthHeaderValue = await jira.createSessionHeaders(jiraSession);
  console.log(jiraAuthHeaderValue);

  const retrievedIssuesSummaries = [];

  log.info('Attempting to search for existing JIRA issues...');

  // Gather the issues that have been resolved with certain criteria
  const { body: resolvedRetrievedIssues } = await jira.searchIssues(jiraAuthHeaderValue, config.JIRA_CONFIG.JIRA_ISSUE_SEARCH_PAYLOAD_RESOLVED_ISSUES);
  const { issues: resolvedIssues } = resolvedRetrievedIssues;
  resolvedIssues.forEach((issue) => {
    retrievedIssuesSummaries.push(issue.fields.summary.split(' ').join(''));
  });

  // Gather the Open issues
  const { body: openRetrievedIssues } = await jira.searchIssues(jiraAuthHeaderValue, config.JIRA_CONFIG.JIRA_ISSUE_SEARCH_PAYLOAD_OPEN_ISSUES);
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
  const issueLabelsMapper = utils.getInput('ISSUE_LABELS_MAPPER');

  let labels = { labels: [] };
  if (issueLabelsMapper.length === 1) {
    labels = { labels: issueLabelsMapper };
  } else if (issueLabelsMapper.length > 1) {
    labels = { labels: issueLabelsMapper.split(',') };
  }

  /*
  * wrapping all the extra keys supplied with the "fields" keyword since it's required for Jira while sending over
  * the issue payload
  */
  const extraJiraFieldsMapper = !(EXTRA_JIRA_FIELDS) ? {} : Object.fromEntries(new Map(Object.entries(utils.populateMap(EXTRA_JIRA_FIELDS))));
  utils.updateObjectKeys('fields', extraJiraFieldsMapper);

  const parsedInput = JSON.parse(inputJson);
  const jiraIssuesPayloadHolder = [];
  for (const inputElement in parsedInput) {
    const reportMapperInstance = utils.reportMapper(
      inputElement,
      parsedInput,
      reportPairsMapper
    );
    const severityMap = priorityMapper.get(reportMapperInstance.issueSeverity);
    if (severityMap !== undefined) {
      if (
        !retrievedIssuesUniqueSummaries.includes(utils.ultraTrim(reportMapperInstance.issueSummary))
      ) {
        log.info(`Attempting to create JSON payload for module ${reportMapperInstance.issueName}...`);
        const jiraIssuePayload = utils.constructJiraIssuePayload(
          reportMapperInstance.issueName,
          reportMapperInstance.issueSummary,
          reportMapperInstance.issueDescription,
          reportMapperInstance.issueSeverity,
          severityMap,
          labels,
          extraJiraFieldsMapper
        );

        jiraIssuesPayloadHolder.push(jiraIssuePayload);
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

  if (jiraIssuesPayloadHolder.length !== 0) {
    await parallelIssueCreation(jiraIssuesPayloadHolder);
  } else {
    log.info('All the vulnerabilities have already been captured as issues on Jira.');
  }

  await logout(jiraAuthHeaderValue);
};

(async () => {
  await kickOffAction(INPUT_JSON);
})();
