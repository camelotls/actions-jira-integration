const _ = require('lodash');

const createTemplate = (templateBluePrint) => {
  const fieldKeys = Object.keys(templateBluePrint);
  const template = {};
  fieldKeys.forEach((field) => {
    _.set(template, field, templateBluePrint[field]);
  });
  return template;
};

module.exports = {
  createTemplate: createTemplate
};
