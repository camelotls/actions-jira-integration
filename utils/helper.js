const fs = require('fs');
const rimraf = require('rimraf');
const { v4 } = require('uuid');
const dirtyJSON = require('dirty-json');
const Validator = require('jsonschema').Validator;
const { spawnSync } = require('child_process');
const assert = require('assert');
const core = require('@actions/core');
const _ = require('lodash');
const bunyan = require('bunyan');
const log = bunyan.createLogger({ name: 'actions-jira-integration' });

const config = require('../config/config');
const template = require('../utils/template');

const jsonValidator = new Validator();
const jiraIssueSchemaBase = {
  type: 'object',
  fields: {
    project: {
      key: {
        type: 'string'
      }
    },
    summary: {
      type: 'string'
    },
    issuetype: {
      name: {
        type: 'string'
      }
    },
    labels: {
      type: 'array'
    },
    description: {
      type: 'string'
    }
  }
};

// use this function in order to minimise the losses caused in JSON parsings when boolean values are present
const booleanToUpper = (input) => {
  return input.replace(/true/g, 'True').replace(/false/g, 'False');
};

const constructJiraIssuePayload = (
  issueName,
  issueSummary,
  issueDescription,
  issueSeverity,
  severityMap,
  issueLabelMapper,
  extraJiraFields
) => {
  const templateInput = template.blueprint(
    issueSummary,
    issueDescription,
    issueSeverity
  );

  /*
   * wrapping all the current template keys with the "fields" keyword since it's required for Jira while sending over
   * the issue payload
   */
  updateObjectKeys('fields', templateInput);

  const finalTemplate = { ...templateInput, ...extraJiraFields };

  const { template: templateModifier, extraFieldsAtomicView } = template.create(finalTemplate, extraJiraFields);
  const jiraIssueSchemaExpansion = extraFieldsAtomicView.fields;
  // construct the new JSON schema that we will use to verify the input JSON
  Object.assign(jiraIssueSchemaBase.fields, jiraIssueSchemaExpansion);

  const payload = `${issueName}_${v4()}_payload.json`;

  let beautifiedTemplate;
  try {
    beautifiedTemplate = dirtyJSON.parse(booleanToUpper(JSON.stringify(templateModifier)));
    Object.assign(beautifiedTemplate.fields, issueLabelMapper);

    const beautifiedTemplateStringified = JSON.stringify(beautifiedTemplate);
    const isValidSchema = (jsonValidator.validate(JSON.parse(beautifiedTemplateStringified), jiraIssueSchemaBase).errors.length === 0);

    try {
      if (isValidSchema) {
        return beautifiedTemplateStringified;
      } else {
        throw new Error(`The beautification of ${issueName} was not possible!`);
      }
    } catch (e) {
      log.warn(e);
    }
  } catch (e) {
    log.warn(`Vulnerability "${issueName}" cannot be turned into a Jira issue since the data provided in the given JSON are malformed and cannot be beautified!`);
  }
};

const folderCleanup = (folder) => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  } else {
    rimraf.sync(folder);
    fs.mkdirSync(folder);
  }
};

const reportMapper = (inputElement, parsedInput, reportPairsMapper) => {
  const mapper = {};
  // eslint-disable-next-line no-unused-vars
  for (const [reportKey, reportValue] of Object.entries(reportPairsMapper)) {
    let firstPass = false;
    const reportInputVariablesFetcher = [...reportValue.match(/\{{(.*?)\}}/g)];
    if (reportInputVariablesFetcher.length === 0) {
      continue;
    }

    for (let keyPosition = 0; keyPosition < reportInputVariablesFetcher.length; keyPosition++) {
      const keyName = reportInputVariablesFetcher[keyPosition].replace('{{', '').replace('}}', '');
      if (reportInputVariablesFetcher.length === 1 || firstPass === false) {
        mapper[reportKey] = reportPairsMapper[reportKey].replace(`{{${keyName}}}`, `${parsedInput[inputElement][keyName]}`);
      } else {
        const parsedInputValue = parsedInput[inputElement][keyName];
        if (typeof parsedInputValue === 'object') {
          let formattedInput = '';
          parsedInputValue.forEach((singleParsedInputValue) => {
            formattedInput += `\u2022 ${singleParsedInputValue}\n`;
          });
          mapper[reportKey] = mapper[reportKey].replace(`{{${keyName}}}`, formattedInput);
        } else {
          mapper[reportKey] = mapper[reportKey].replace(`{{${keyName}}}`, `${parsedInputValue}`);
        }
      }
      firstPass = true;
    }
  }

  return mapper;
};

const populateMap = (yamlKey) => {
  const yamlPairs = yamlKey.split('\n')
    .map(pair => pair.trim())
    .filter(pair => {
      return pair !== '';
    });

  const map = {};

  yamlPairs.forEach(pair => {
    const key = pair.substr(0, pair.indexOf(':'));
    const value = pair.substr(pair.indexOf(': ') + 1, pair.length - 1).trimStart();

    map[key] = value.trim();
  });

  return map;
};

const fixJiraURI = (jiraURI) => {
  if (!jiraURI.match(/^https:\/\/|^http:\/\//)) {
    return `https://${jiraURI}`;
  }
  return jiraURI;
};

const shellExec = (command) => {
  let cmdOutput = '';
  const executedCommand = spawnSync(command, {
    shell: true
  });

  if (executedCommand.status !== 0) {
    assert.fail(executedCommand.stderr.toString());
  } else {
    cmdOutput = executedCommand.stdout.toString().trim();
    assert.strictEqual((cmdOutput.includes('FAILED') || []).length, 0, cmdOutput);
  }

  return cmdOutput;
};

const retrievePathFiles = async (path) => {
  let files = [];
  try {
    files = await fs.promises.readdir(path);
  } catch (e) {
    log.error(e);
    process.exit(1);
  }

  return files;
};

const ultraTrim = (input) => {
  return input.split(' ').join('');
};

const getInput = (name) => {
  return core.getInput(name) || process.env[name];
};

const updateObjectKeys = (newKey, examinedObject) => {
  // eslint-disable-next-line no-unused-vars
  for (const [key, value] of Object.entries(examinedObject)) {
    Object.defineProperty(examinedObject, `${newKey}.${key}`, Object.getOwnPropertyDescriptor(examinedObject, key));
    delete examinedObject[key];
  }
};

module.exports = {
  constructJiraIssuePayload,
  folderCleanup,
  reportMapper,
  populateMap,
  fixJiraURI,
  shellExec,
  retrievePathFiles,
  ultraTrim,
  getInput,
  updateObjectKeys
};
