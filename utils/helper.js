const fs = require('fs');
const rimraf = require('rimraf');
const { v4 } = require('uuid');
const dirtyJSON = require('dirty-json');
const Validator = require('jsonschema').Validator;
const config = require('../config/config');
const { templateBluePrint } = require('../config/template.config');
const { createTemplate } = require('../utils/templates.flexible.creation');
const bunyan = require('bunyan');
const { spawnSync } = require('child_process');
const assert = require('assert');
const log = bunyan.createLogger({ name: 'actions-jira-integration' });
const core = require('@actions/core');
const _ = require('lodash');

const jiraIssueSchema = {
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
const jsonValidator = new Validator();

// use this function in order to minimise the losses caused in JSON parsings when boolean values are present
const booleanToUpper = (input) => {
  return input.replace(/true/g, 'True').replace(/false/g, 'False');
};

const amendHandleBarTemplate = (
  issueModule,
  issueSummary,
  issueDescription,
  issueSeverity,
  severityMap,
  issueLabelMapper
) => {
  const templateInput = templateBluePrint(
    issueSummary,
    issueDescription,
    issueSeverity
  );
  const extraFieldsUserInput = { 'fields.test.component': 'testValue', 'fields.project.key': 'testValue' };

  const finalTemplate = { ...templateInput, ...extraFieldsUserInput };

  const templateModifier = createTemplate(finalTemplate);
  console.log('------DEBUG------' + JSON.stringify(templateModifier));
  const payload = `${issueModule}_${v4()}_payload.json`;

  let beautifiedTemplate;
  try {
    beautifiedTemplate = dirtyJSON.parse(booleanToUpper(templateModifier));
    Object.assign(beautifiedTemplate.fields, issueLabelMapper);

    const beautifiedTemplateStringified = JSON.stringify(beautifiedTemplate);
    const isValidSchema = (jsonValidator.validate(JSON.parse(beautifiedTemplateStringified), jiraIssueSchema).errors.length === 0);

    try {
      if (isValidSchema) {
        fs.writeFileSync(`${config.UTILS.PAYLOADS_DIR}/${payload}`, beautifiedTemplateStringified, 'utf8');
      } else {
        throw new Error(`The beautification of ${issueModule} was not possible!`);
      }
    } catch (e) {
      log.warn(e);
    }
  } catch (e) {
    log.warn(`Vulnerability "${issueModule}" cannot be turned into a Jira issue since the data provided in the given JSON are malformed and cannot be beautified!`);
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
        mapper[reportKey] = mapper[reportKey].replace(`{{${keyName}}}`, `${parsedInput[inputElement][keyName]}`);
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

module.exports = {
  amendHandleBarTemplate: amendHandleBarTemplate,
  folderCleanup: folderCleanup,
  reportMapper: reportMapper,
  populateMap: populateMap,
  fixJiraURI: fixJiraURI,
  shellExec: shellExec,
  retrievePathFiles: retrievePathFiles,
  ultraTrim: ultraTrim,
  getInput: getInput
};
