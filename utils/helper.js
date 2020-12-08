const fs = require('fs');
const rimraf = require('rimraf');

const handlebars = require('handlebars');
const config = require('../config/config');

const jiraPriorityMapper = (severity) => {
    switch (severity) {
        case 'low':
            return 'P3';
            break;
        case 'moderate':
            return 'P2';
            break;
        case 'high':
            return 'P1';
            break;
        default:
            return 'Undefined';
            break;
    }
};

const validInput = (input, rejectionFlag) => {
    return JSON.stringify(input).includes(rejectionFlag) ? false : true;
};

const npmAuditReportParser = (report, advisoryId) => {
    let {id, module_name, vulnerable_versions, patched_versions, overview, recommendation, references, severity, cwe, url} = JSON.parse(report).advisories[advisoryId];

    return {
        moduleId: id,
        moduleName: module_name,
        vulnerableVersions: vulnerable_versions,
        patchedVersions: patched_versions,
        overview: overview,
        recommendation: recommendation,
        references: references,
        severity: severity,
        cwe: cwe,
        url: url,
    };
};

const amendHandleBarTemplate = (
    template,
    issueModule,
    issueSummary,
    issueDescription,
    issueSeverity
) => {
    let templateStored = fs.readFileSync(`${config.UTILS.TEMPLATES_DIR}/${template}`, 'utf8').toString();
    let templateReader = handlebars.compile(templateStored, {noEscape: true});
    let templateModifier = templateReader({
        PROJECT_ID: config.JIRA_CONFIG.JIRA_PROJECT_ID,
        ISSUE_SUMMARY: `${issueSummary}`,
        ISSUE_DESCRIPTION: `${issueDescription}`,
        ISSUE_SEVERITY: `${issueSeverity}`,
    });
    let payload = `${issueModule}_payload.json`;

    fs.writeFileSync(`${config.UTILS.PAYLOADS_DIR}/${payload}`, templateModifier, 'utf8');

    console.log(`File ${payload} created successfully!`);
};

const folderCleanup = (folder) => {
    if(!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
    } else {
        rimraf.sync(folder);
        fs.mkdirSync(folder);
    }
}

module.exports = {
    jiraPriorityMapper: jiraPriorityMapper,
    validInput: validInput,
    npmAuditReportParser: npmAuditReportParser,
    amendHandleBarTemplate: amendHandleBarTemplate,
    folderCleanup: folderCleanup,
};
