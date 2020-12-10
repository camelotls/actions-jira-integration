const fs = require('fs');
const rimraf = require('rimraf');

const handlebars = require('handlebars');
const config = require('../config/config');

const jiraPriorityMapper = (severity) => {
  switch (severity) {
    case 'low':
      return 'P3';
    case 'moderate':
      return 'P2';
    case 'high':
      return 'P1';
    default:
      return 'Undefined';
  }
};

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
    PROJECT_ID: config.JIRA_CONFIG.JIRA_PROJECT_ID,
    ISSUE_SUMMARY: `${issueSummary}`,
    ISSUE_DESCRIPTION: `${issueDescription}`,
    ISSUE_SEVERITY: `${issueSeverity}`
  });
  const payload = `${issueModule}_payload.json`;

  fs.writeFileSync(`${config.UTILS.PAYLOADS_DIR}/${payload}`, templateModifier, 'utf8');

  console.log(`File ${payload} created successfully!`);
};

const folderCleanup = (folder) => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  } else {
    rimraf.sync(folder);
    fs.mkdirSync(folder);
  }
};

module.exports = {
  jiraPriorityMapper: jiraPriorityMapper,
  amendHandleBarTemplate: amendHandleBarTemplate,
  folderCleanup: folderCleanup
};
