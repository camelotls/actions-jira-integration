const fs = require('fs');
const rimraf = require('rimraf');
const handlebars = require('handlebars');
const { v4 } = require('uuid');
const dirtyJSON = require('dirty-json');
const Validator = require('jsonschema').Validator;
const config = require('../config/config');
const bunyan = require('bunyan');
const log = bunyan.createLogger({ name: 'actions-jira-integration' });

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

const amendHandleBarTemplate = (
  template,
  issueModule,
  issueSummary,
  issueDescription,
  issueSeverity,
  severityMap,
  issueLabelMapper
) => {
  const templateStored = fs.readFileSync(`${config.UTILS.TEMPLATES_DIR}/${template}`, 'utf8').toString();
  const templateReader = handlebars.compile(templateStored, { noEscape: true });

  const templateModifier = templateReader({
    PROJECT_ID: config.JIRA_CONFIG.JIRA_PROJECT,
    ISSUE_SUMMARY: `${issueSummary}`,
    ISSUE_DESCRIPTION: `${issueDescription}`,
    ISSUE_SEVERITY: `${issueSeverity}`,
    ISSUE_SEVERITY_MAP: `${severityMap}`
  });

  const payload = `${issueModule}_${v4()}_payload.json`;

  let beautifiedTemplate;
  try {
    beautifiedTemplate = dirtyJSON.parse(templateModifier);
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

module.exports = {
  amendHandleBarTemplate: amendHandleBarTemplate,
  folderCleanup: folderCleanup,
  reportMapper: reportMapper,
  populateMap: populateMap
};
