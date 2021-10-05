const config = require('../config/config');
const _ = require('lodash');

const blueprint = (
  issueSummary,
  issueDescription,
  severityMap
) => {
  return {
    'project.key': config.JIRA_CONFIG.JIRA_PROJECT,
    summary: `${issueSummary}`,
    'issuetype.name': config.JIRA_CONFIG.ISSUE_TYPE,
    'priority.name': `${severityMap}`,
    description: `${issueDescription}`
  };
};

const create = (templateBluePrint) => {
  const fieldKeys = Object.keys(templateBluePrint);
  const template = {};

  fieldKeys.forEach((field) => {
    _.set(template, field, templateBluePrint[field]);
  });

  return template;
};

module.exports = { blueprint, create };
