const readFileSync = require('fs').readFileSync;
const jira = require('../../helpers/jira-helpers');
const rest = require('../../helpers/rest-helper');

const provideEnvironment = (envVars) => {
  process.env = {
    ...envVars,
    INPUT_JSON: readFileSync('./test/testdata/audit/error.json', 'utf8'),
    REPORT_INPUT_KEYS: readFileSync('./inputReportKeys', 'utf8'),
    ISSUE_LABEL_MAPPER: 'Security,npm_audit',
    PRIORITY_MAPPER: readFileSync('./priorityMapper', 'utf8')
  };
};

const getIssuesFromJira = async () => {
  const jiraSession = await jira.createJiraSession(process.env.JIRA_USER, process.env.JIRA_PASSWORD);
  const jiraAuthHeaderValue = await jira.createJiraSessionHeaders(jiraSession);
  const response = await jira.searchExistingJiraIssues(jiraAuthHeaderValue);
  await jira.invalidateJiraSession(jiraAuthHeaderValue);
  return response;
};

const createIssueType = async (issueType, description = 'a description', type = 'standard') => {
  const jiraSession = await jira.createJiraSession(process.env.JIRA_USER, process.env.JIRA_PASSWORD);
  const jiraAuthHeaderValue = await jira.createJiraSessionHeaders(jiraSession);
  const payload = {
    name: issueType,
    description: description,
    type: type
  };
  await rest.POSTRequestWrapper(createIssueType.name, process.env.JIRA_URI, '/rest/api/2/issuetype', 'application/json', jiraAuthHeaderValue, payload);
  await jira.invalidateJiraSession(jiraAuthHeaderValue);
};

module.exports = { provideEnvironment, getIssuesFromJira, createIssueType };
