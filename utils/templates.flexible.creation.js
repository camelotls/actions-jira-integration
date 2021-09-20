const { templateBluePrint } = require('../config/template.config');
const _ = require('lodash');

const fieldKeys = Object.keys(templateBluePrint);

const addToTemplate = (field, template) => {
  if (fieldKeys.includes(field)) {
    templateBluePrint[field].forEach((valueKeyPair) => {
      if (valueKeyPair.value) {
        _.set(template, valueKeyPair.keys, valueKeyPair.value);
      }
    });
  }
  return template;
};

const finalTemplate = (fields, template) => {
  fields.forEach((field) => {
    addToTemplate(field, template);
  });
  return _.set({}, 'fields', template);
};

module.exports = {
  finalTemplate: finalTemplate
};
