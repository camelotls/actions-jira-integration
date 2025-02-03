import { JIRA_CONFIG } from '../config/config.js';
import { parseDescription } from '../utils/helper.js';
import _ from 'lodash';

export const blueprint = (
  issueSummary,
  issueDescription,
  severityMap
) => {
  return {
    'project.key': JIRA_CONFIG.JIRA_PROJECT,
    summary: `${issueSummary}`,
    'issuetype.name': JIRA_CONFIG.ISSUE_TYPE,
    'priority.name': `${severityMap}`,
    description: parseDescription(issueDescription)
  };
};

export const createFromTemplate = (templateBluePrint) => {
  const fieldKeys = Object.keys(templateBluePrint);
  const template = {};
  const extraFieldsAtomicView = {};

  fieldKeys.forEach((field) => {
    // excluding the description field since it's considered one of the basic fields we use in the action
    if (field.includes('description')) {
      _.set(template, field, templateBluePrint[field]);
      _.set(extraFieldsAtomicView, field, { type: 'object' });
      return;
    }
    // For the extra fields supplied, we need to determine the data type in order to properly construct the JSON
    // schema to be used. Array types are special data types used in that module
    const fieldType = templateBluePrint[field].match(/\[.+\]/g) !== null ? 'array' : typeof templateBluePrint[field];
    if (fieldType === 'array') {
      let formattedValue = templateBluePrint[field].replace(/\[|\]/g, '').replace(/,\s/g, ',').split(',');

      // Deconstruct field into array and gets final value
      const deconstructedField = field.split('.');
      const finalField = deconstructedField.pop();

      if (finalField.includes('{')) {
        formattedValue = formattedValue.map(value => _.set({}, finalField.replace(/\{|\}/g, ''), value));
      }
      const remainingField = deconstructedField.join('.');

      _.set(template, remainingField, formattedValue);
    } else {
      _.set(template, field, templateBluePrint[field]);
    }
    _.set(extraFieldsAtomicView, field, { type: fieldType });
  });
  return { template, extraFieldsAtomicView };
};
