const readFileSync = require('fs').readFileSync;
const jira = require('../../helpers/jira-helpers');

const provideEnvironment = (envVars) => {
  process.env = {
    ...envVars,
    INPUT_JSON: readFileSync('./test/testdata/audit/error.json', 'utf8'),
    REPORT_INPUT_KEYS: readFileSync('./test/testdata/envVars/inputReportKeys', 'utf8'),
    ISSUE_LABELS_MAPPER: readFileSync('./test/testdata/envVars/labelMapper', 'utf8'),
    // we keep the default issue types offered by the container (Improvement, Task, New Feature, Bug, Epic, Story)
    JIRA_ISSUE_TYPE: 'Improvement',
    // we keep the default priorities offered by the container (Highest, High, Medium, Low, Lowest) to reduce complexity
    PRIORITY_MAPPER: readFileSync('./test/testdata/envVars/priorityMapper', 'utf8')
  };
};

const getIssuesFromJira = async () => {
  const jiraSession = await jira.createJiraSession(process.env.JIRA_USER, process.env.JIRA_PASSWORD);
  const jiraAuthHeaderValue = await jira.createJiraSessionHeaders(jiraSession);

  const response = await jira.searchExistingJiraIssues(jiraAuthHeaderValue);

  return response;
};

module.exports = { provideEnvironment, getIssuesFromJira };
