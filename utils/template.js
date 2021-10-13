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
  const extraFieldsAtomicView = {};

  fieldKeys.forEach((field) => {
    // For the extra fields supplied, we need to determine the data type in order to properly construct the JSON
    // schema to be used. Array types are special data types used in that module
    const fieldType = templateBluePrint[field].match(/\[.+\]/g) !== null ? 'array' : typeof templateBluePrint[field];
    if (fieldType === 'array') {
      // Removes quotes from the array (example '[a, b]' ----> ['a','b'])
      const removeArrayQuotes = (array) => array.replace(/\[|\]/g, '').replace(/,\s/g, ',').split(',');
      let formattedValue = removeArrayQuotes(templateBluePrint[field]);

      // Deconstruct field into array and gets final value (example a.b.c ---> [a, b, c] ----> [a,b] c)
      const deconstructedField = field.split('.');
      const finalField = deconstructedField.pop();

      // Check if the intended transformation is a.b.c, [d, e] ----> {a: {b: [{c: d}, {c: e}]}} or  {a: {b: {c: [d, e]}}}
      if (finalField.includes('{')) {
        // Creates the array-value (example [{ id: v1 }, { id: v2 }]
        formattedValue = formattedValue.map(value => _.set({}, finalField.replace(/\{|\}/g, ''), value));
      }
      // Reconstructs field
      const remainingField = deconstructedField.join('.');

      // Puts everything together (a.b.c, [d, e] ----> { a: { b: { c: [d, e]}}} or a.b.{c}, [d, e] ----> { a: b: [{ c: d }, { c: e}] }
      _.set(template, remainingField, formattedValue);
    } else {
      _.set(template, field, templateBluePrint[field]);
    }
    _.set(extraFieldsAtomicView, field, { type: fieldType });
  });
  return { template, extraFieldsAtomicView };
};

module.exports = { blueprint, create };
