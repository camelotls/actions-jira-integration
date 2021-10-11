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
    let blueprintKey = templateBluePrint[field];

    if (Object.keys(extraJiraFields).includes(field)) {
      // For the extra fields supplied, we need to determine the data type in order to properly construct the JSON
      // schema to be used. Array types are special data types used in that module
      const fieldType = templateBluePrint[field].match(/\[.+\]/g) !== null ? 'array' : typeof templateBluePrint[field];

      if (fieldType === 'array') {
        // TODO: The implementation below refers purely to cases that contain single element arrays since it's a hot fix
        // for a last minute problem identified during testing. We should fix this logic to accept any length of arrays
        // supplied.
        const mainKey = `${field.replace('fields.', '')}`;
        const parentArrayObject = { [mainKey]: [] };
        const childKeyToBeQuoted = extraJiraFields[field].substring(extraJiraFields[field].indexOf('{') + 1, extraJiraFields[field].lastIndexOf(':'));
        const childKeyValue = extraJiraFields[field].substring(extraJiraFields[field].indexOf(':') + 1, extraJiraFields[field].lastIndexOf('}')).trim();

        parentArrayObject[mainKey].push({
          [childKeyToBeQuoted]: childKeyValue
        });

        blueprintKey = parentArrayObject[mainKey];
      }
      _.set(extraFieldsAtomicView, field, { type: fieldType });
    }
    _.set(template, field, blueprintKey);
  });

  return { template, extraFieldsAtomicView };
};

module.exports = { blueprint, create };
