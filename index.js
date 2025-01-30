import core from '@actions/core';
import _ from 'lodash';
import fs from 'fs';
import bunyan from 'bunyan';
import { JIRA_CONFIG } from './config/config.js';
import {
  constructJiraIssuePayload,
  fixJiraURI,
  getInput,
  populateMap,
  reportMapper,
  retrievePathFiles,
  ultraTrim,
  updateObjectKeys
} from './utils/helper.js';
import {
  createIssue,
  createSession,
  createSessionHeaders,
  invalidateSession,
  pushAttachment, searchIssues
} from './helpers/jira-helpers.js';

const log = bunyan.createLogger({ name: 'actions-jira-integration' });

const REPORT_INPUT_KEYS = getInput('REPORT_INPUT_KEYS');
const PRIORITY_MAPPER = getInput('PRIORITY_MAPPER');
const UPLOAD_FILES = getInput('UPLOAD_FILES') === 'true';
const UPLOAD_FILES_PATH = core.getInput('UPLOAD_FILES_PATH') || process.env.UPLOAD_FILES_PATH;
const EXTRA_JIRA_FIELDS = getInput('EXTRA_JIRA_FIELDS');
const INPUT_JSON = fs.readFileSync(getInput('INPUT_JSON'), 'utf8');

let jiraAuthHeaderValue;

const createdJiraIssues = [];

const createJiraIssue = async (payload) => {
  // this is done here in order to handle more easily the async nature of the call
  let filesToBeUploaded = [];
  if (UPLOAD_FILES) {
    filesToBeUploaded = await retrievePathFiles(UPLOAD_FILES_PATH);
  }

  return createIssue(jiraAuthHeaderValue, payload).then((jiraIssue) => {
    const jiraIssueKey = jiraIssue.body.key;
    const jiraIssueSummary = JSON.parse(payload).fields.summary;
    const jiraIssueURL = `${fixJiraURI(JIRA_CONFIG.JIRA_URI)}/browse/${jiraIssueKey}`;

    log.info(`A jira issue with the following details has been raised: ${jiraIssueURL}`);

    createdJiraIssues.push({
      key: jiraIssueKey,
      url: jiraIssueURL
    });

    // upload the attachments to the relevant issue created
    if (UPLOAD_FILES) {
      filesToBeUploaded.forEach((file) => {
        // focus on the file name, not the file extension
        if (jiraIssueSummary.toLowerCase().includes(file.substr(0, file.indexOf('.')).toLowerCase())) {
          return pushAttachment(`${UPLOAD_FILES_PATH}/${file}`, jiraIssueKey).then(() => {
            log.info(`Pushing attachment ${file} to issue ${jiraIssueKey}...`);
          });
        }
      });
    }
  });
};

const parallelIssueCreation = (jiraIssuesPayloads) => {
  return Promise.all(jiraIssuesPayloads.map(payload => createJiraIssue(payload))).catch((e) => {
    log.error(`The Jira issue creation encountered the following error: ${e}`);
    core.exportVariable('ERROR_MSG', `${e}`);
  });
};

const logout = async (jiraAuthHeaderValue) => {
  log.info('Attempting to logout from the existing JIRA session...');
  await invalidateSession(jiraAuthHeaderValue);
  log.info('JIRA session invalidated successfully!');
};

const kickOffAction = async (inputJson) => {
  if (JIRA_CONFIG.JIRA_ON_CLOUD === 'true') {
    jiraAuthHeaderValue = `Basic ${JIRA_CONFIG.JIRA_CLOUD_TOKEN}`;
  } else {
    const jiraSession = await createSession(JIRA_CONFIG.JIRA_USER, JIRA_CONFIG.JIRA_PASSWORD);
    log.info('JIRA session created successfully!');

    jiraAuthHeaderValue = createSessionHeaders(jiraSession);
  }

  const retrievedIssuesSummaries = [];

  log.info('Attempting to search for existing JIRA issues...');

  // Gather the issues that have been resolved with certain criteria
  const { body: resolvedRetrievedIssues } = await searchIssues(jiraAuthHeaderValue, JIRA_CONFIG.JIRA_ISSUE_SEARCH_PAYLOAD_RESOLVED_ISSUES);
  const { issues: resolvedIssues } = resolvedRetrievedIssues;
  resolvedIssues.forEach((issue) => {
    retrievedIssuesSummaries.push(issue.fields.summary.split(' ').join(''));
  });

  // Gather the Open issues
  const { body: openRetrievedIssues } = await searchIssues(jiraAuthHeaderValue, JIRA_CONFIG.JIRA_ISSUE_SEARCH_PAYLOAD_OPEN_ISSUES);
  const { issues: openIssues } = openRetrievedIssues;
  openIssues.forEach((issue) => {
    retrievedIssuesSummaries.push(issue.fields.summary.split(' ').join(''));
  });

  const retrievedIssuesUniqueSummaries = _.uniq(retrievedIssuesSummaries);

  if (resolvedIssues.length !== 0 && openIssues.length !== 0) {
    log.info('Existing JIRA issues retrieved successfully!');
  }

  const priorityMapper = new Map(
    Object.entries(populateMap(PRIORITY_MAPPER))
  );
  const reportPairsMapper = populateMap(REPORT_INPUT_KEYS);
  const issueLabelsMapper = getInput('ISSUE_LABELS_MAPPER');

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
  const extraJiraFieldsMapper = !(EXTRA_JIRA_FIELDS) ? {} : Object.fromEntries(new Map(Object.entries(populateMap(EXTRA_JIRA_FIELDS))));
  updateObjectKeys('fields', extraJiraFieldsMapper);

  const parsedInput = JSON.parse(inputJson);
  const jiraIssuesPayloadHolder = [];
  for (const inputElement in parsedInput) {
    const reportMapperInstance = reportMapper(
      inputElement,
      parsedInput,
      reportPairsMapper
    );
    const severityMap = priorityMapper.get(reportMapperInstance.issueSeverity);
    if (severityMap !== undefined) {
      if (
        !retrievedIssuesUniqueSummaries.includes(ultraTrim(reportMapperInstance.issueSummary))
      ) {
        log.info(`Attempting to create JSON payload for module ${reportMapperInstance.issueName}...`);
        const jiraIssuePayload = constructJiraIssuePayload(
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
          if (ultraTrim(openIssue.fields.summary) === ultraTrim(reportMapperInstance.issueSummary)) {
            log.info(`The issue for ${reportMapperInstance.issueName} is already open - more details on ${fixJiraURI(JIRA_CONFIG.JIRA_URI)}/browse/${openIssue.key}`);
          }
        });

        resolvedIssues.forEach(resolvedIssue => {
          if (ultraTrim(resolvedIssue.fields.summary) === ultraTrim(reportMapperInstance.issueSummary)) {
            log.info(`The issue for ${reportMapperInstance.issueName} has already been resolved - more details on ${fixJiraURI(JIRA_CONFIG.JIRA_URI)}/browse/${resolvedIssue.key}`);
          }
        });
      }
    } else {
      log.info(`Skipping creation of module ${reportMapperInstance.issueName}`);
    }
  }

  if (jiraIssuesPayloadHolder.length !== 0) {
    await parallelIssueCreation(jiraIssuesPayloadHolder);
    core.setOutput('created-jira-issues', JSON.stringify(createdJiraIssues));
  } else {
    log.info('All the vulnerabilities have already been captured as issues on Jira.');
  }
  if (JIRA_CONFIG.JIRA_ON_CLOUD !== 'true') {
    await logout(jiraAuthHeaderValue);
  }
};

(async () => {
  await kickOffAction(INPUT_JSON);
})();
