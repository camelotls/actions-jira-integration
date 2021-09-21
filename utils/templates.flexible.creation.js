const _ = require('lodash');

const addToTemplate = (field, template, templateBluePrint) => {
  templateBluePrint[field].forEach((valueKeyPair) => {
    if (valueKeyPair.value) {
      _.set(template, valueKeyPair.keys, valueKeyPair.value);
    }
  });
  return template;
};

const createTemplate = (templateBluePrint) => {
  const fieldKeys = Object.keys(templateBluePrint);
  const template = {};
  fieldKeys.forEach((field) => {
    if (fieldKeys.includes(field)) {
      addToTemplate(field, template, templateBluePrint);
    }
  });
  return _.set({}, 'fields', template);
};

module.exports = {
  createTemplate: createTemplate
};
