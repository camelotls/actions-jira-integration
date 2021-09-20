const fs = require('fs');
const rimraf = require('rimraf');
const { v4 } = require('uuid');
const dirtyJSON = require('dirty-json');
const Validator = require('jsonschema').Validator;
const config = require('../config/config');
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
  const defaultTemplate = { };
  const templateBluePrint = {
    PROJECT_ID: [{
      keys: ['project', 'key'],
      value: config.JIRA_CONFIG.JIRA_PROJECT
    }],
    ISSUE_SUMMARY: [{
      keys: ['summary'],
      value: `${issueSummary}`
    }],
    ISSUE_TYPE: [{
      keys: ['issuetype', 'name'],
      value: config.JIRA_CONFIG.ISSUE_TYPE
    }],
    ISSUE_ASSIGNEE: [{
      keys: ['assignee', 'name'],
      value: config.JIRA_CONFIG.ISSUE_ASSIGNEE
    }],
    ISSUE_REPORTER: [{
      keys: ['reporter', 'name'],
      value: config.JIRA_CONFIG.ISSUE_REPORTER
    }],
    ISSUE_PRIORITY: [{
      keys: ['priority', 'id'],
      value: config.JIRA_CONFIG.ISSUE_PRIORITY
    }],
    ISSUE_LABELS: [{
      keys: ['labels'],
      value: config.JIRA_CONFIG.ISSUE_LABELS
    }],
    ISSUE_TIME_TRACKING: [{
      keys: ['timetracking', 'originalEstimate'],
      value: 'testValue1'
    },
    {
      keys: ['timetracking', 'remainingEstimate'],
      value: 'testValue2'
    }
    ],
    ISSUE_SECURITY: [{
      keys: ['security', 'id'],
      value: config.JIRA_CONFIG.ISSUE_SECURITY
    }],
    ISSUE_VERSIONS: [{
      keys: ['versions'],
      value: config.JIRA_CONFIG.ISSUE_VERSIONS
    }],
    ISSUE_ENVIRONMENT: [{
      keys: ['environment'],
      value: config.JIRA_CONFIG.ISSUE_ENVIRONMENT
    }],
    ISSUE_DESCRIPTION: [{
      keys: ['description'],
      value: `${issueDescription}`
    }],
    ISSUE_DUE_DATE: [{
      keys: ['duedate'],
      value: config.JIRA_CONFIG.ISSUE_DUE_DATE
    }],
    ISSUE_FIX_VERSIONS: [{
      keys: ['fixVersions'],
      value: config.JIRA_CONFIG.ISSUE_FIX_VERSIONS
    }],
    ISSUE_COMPONENTS: [{
      keys: ['components'],
      value: config.JIRA_CONFIG.ISSUE_COMPONENTS
    }],
    ISSUE_SEVERITY_MAP: [{
      keys: ['priority', 'name'],
      value: `${severityMap}`
    }]
  };
  const fieldKeys = Object.keys(templateBluePrint);

  const addToTemplate = (field, template) => {
    if (fieldKeys.includes(field)) {
      console.log('HERE IT IS ' + JSON.stringify(templateBluePrint));
      templateBluePrint[field].forEach((valueKeyPair) => {
        console.log('VALUEPAIR: ' + JSON.stringify(valueKeyPair));
        if (valueKeyPair.value) {
          _.set(template, valueKeyPair.keys, valueKeyPair.value);
        }
      });
    }
    return template;
  };

  const finalTemplate = (fields) => {
    const template = defaultTemplate;
    fields.forEach((field) => {
      addToTemplate(field, template);
      console.log(addToTemplate(field, template));
    });
    return _.set({}, 'fields', template);
  };

  const templateModifier = finalTemplate(fieldKeys);
  // TODO REMOVE BELOW CONSOLE LOG
  console.log('----------------DEBUG------------------- ',
    '\n',
    dirtyJSON.parse(booleanToUpper(JSON.stringify(finalTemplate(fieldKeys)))),
    '\n',
    '-------- END OF DEBUG-------');

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
