const fs = require('fs');
const rimraf = require('rimraf');

const handlebars = require('handlebars');
const config = require('../config/config');

const amendHandleBarTemplate = (
  template,
  issueModule,
  issueSummary,
  issueDescription,
  issueSeverity
) => {
  const templateStored = fs.readFileSync(`${config.UTILS.TEMPLATES_DIR}/${template}`, 'utf8').toString();
  const templateReader = handlebars.compile(templateStored, { noEscape: true });
  const templateModifier = templateReader({
    PROJECT_ID: config.JIRA_CONFIG.JIRA_PROJECT,
    ISSUE_SUMMARY: `${issueSummary}`,
    ISSUE_DESCRIPTION: `${issueDescription}`,
    ISSUE_SEVERITY: `${issueSeverity}`
  });
  const payload = `${issueModule}_payload.json`;

  fs.writeFileSync(`${config.UTILS.PAYLOADS_DIR}/${payload}`, templateModifier, 'utf8');
};

const folderCleanup = (folder) => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  } else {
    rimraf.sync(folder);
    fs.mkdirSync(folder);
  }
};

const reportMapper = (inputElement, parsedInput, reportPairsMapper, isNpmAudit) => {
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
        if (isNpmAudit && keyName === 'overview') {
          const overview = parsedInput[inputElement][keyName];
          mapper[reportKey] = mapper[reportKey].replace(`{{${keyName}}}`, `${overview.slice(0, overview.lastIndexOf('.')).replace(/\n/g, '').replace(/"/g, '')}`);
        } else {
          mapper[reportKey] = mapper[reportKey].replace(`{{${keyName}}}`, `${parsedInput[inputElement][keyName]}`);
        }
      }
      firstPass = true;
    }
  }

  return mapper;
};

module.exports = {
  amendHandleBarTemplate: amendHandleBarTemplate,
  folderCleanup: folderCleanup,
  reportMapper: reportMapper
};
