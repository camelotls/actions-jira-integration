const config = require('../config/config');

const templateBluePrint = (
  issueSummary,
  issueDescription,
  severityMap
) => {
  return {
    'fields.project.key': config.JIRA_CONFIG.JIRA_PROJECT,
    'fields.summary': `${issueSummary}`,
    'fields.issuetype.name': config.JIRA_CONFIG.ISSUE_TYPE,
    'fields.priority.name': `${severityMap}`,
    'fields.description': `${issueDescription}`
  };
};

module.exports = {
  templateBluePrint: templateBluePrint
};
