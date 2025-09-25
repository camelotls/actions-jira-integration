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
    const raw = templateBluePrint[field];

    // Keep description fields as-is and mark type as 'object'
    if (field.includes('description')) {
      _.set(template, field, raw);
      _.set(extraFieldsAtomicView, field, { type: 'object' });
      return;
    }

    // Safer array detection: real arrays OR whole-string bracketed list (e.g., "[a,b]")
    const isArrayValue =
      Array.isArray(raw) ||
      (typeof raw === 'string' && /^\s*\[[^[\]]*]\s*$/.test(raw));

    const fieldType = isArrayValue ? 'array' : typeof raw;

    if (isArrayValue) {
      // Normalize into an array
      let formattedValue;
      if (Array.isArray(raw)) {
        formattedValue = raw;
      } else {
        // Remove ONLY the outer [ ] and split by commas
        const inner = raw.trim().slice(1, -1);
        formattedValue = inner
          .split(',')
          .map(v => v.trim())
          .filter(v => v.length > 0);
      }

      // Deconstruct field into array and get final value
      const deconstructedField = field.split('.');
      const finalField = deconstructedField.pop();
      const remainingField = deconstructedField.join('.');

      if (finalField && finalField.includes('{')) {
        const key = finalField.replace(/\{|\}/g, '');
        formattedValue = formattedValue.map(value => _.set({}, key, value));
      }

      _.set(template, remainingField, formattedValue);
    } else {
      _.set(template, field, raw);
    }

    _.set(extraFieldsAtomicView, field, { type: fieldType });
  });

  return { template, extraFieldsAtomicView };
};
