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

const create = (templateBluePrint, extraJiraFields) => {
  const fieldKeys = Object.keys(templateBluePrint);
  const template = {};
  const extraFieldsAtomicView = {};

  fieldKeys.forEach((field) => {
    if (Object.keys(extraJiraFields).includes(field)) {
      // For the extra fields supplied, we need to determine the data type in order to properly construct the JSON
      // schema to be used. Array types are special data types used in that module
      const fieldType = templateBluePrint[field].match(/\[.+\]/g) !== null ? 'array' : typeof templateBluePrint[field];
      _.set(extraFieldsAtomicView, field, { type: fieldType });
    }
    _.set(template, field, templateBluePrint[field]);
  });

  return { template, extraFieldsAtomicView };
};

module.exports = { blueprint, create };
