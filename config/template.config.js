const config = require('../config/config');

const templateBluePrint = (
  issueSummary,
  issueDescription,
  severityMap
) => {
  return {
    PROJECT_ID: [{
      keys: ['project', 'key'],
      value: config.JIRA_CONFIG.JIRA_PROJECT
    }],
    ISSUE_SUMMARY:
      [{
        keys: ['summary'],
        value: `${issueSummary}`
      }],
    ISSUE_TYPE:
      [{
        keys: ['issuetype', 'name'],
        value: config.JIRA_CONFIG.ISSUE_TYPE
      }],
    ISSUE_ASSIGNEE:
      [{
        keys: ['assignee', 'name'],
        value: config.JIRA_CONFIG.ISSUE_ASSIGNEE
      }],
    ISSUE_REPORTER:
      [{
        keys: ['reporter', 'name'],
        value: config.JIRA_CONFIG.ISSUE_REPORTER
      }],
    ISSUE_PRIORITY:
      [{
        keys: ['priority', 'id'],
        value: config.JIRA_CONFIG.ISSUE_PRIORITY
      }],
    ISSUE_LABELS:
      [{
        keys: ['labels'],
        value: config.JIRA_CONFIG.ISSUE_LABELS
      }],
    ISSUE_TIME_TRACKING:
      [{
        keys: ['timetracking', 'originalEstimate'],
        value: config.JIRA_CONFIG.ISSUE_TIME_TRACKING[0]
      },
      {
        keys: ['timetracking', 'remainingEstimate'],
        value: config.JIRA_CONFIG.ISSUE_TIME_TRACKING[1]
      }
      ],
    ISSUE_SECURITY:
      [{
        keys: ['security', 'id'],
        value: config.JIRA_CONFIG.ISSUE_SECURITY
      }],
    ISSUE_VERSIONS:
      [{
        keys: ['versions'],
        value: config.JIRA_CONFIG.ISSUE_VERSIONS
      }],
    ISSUE_ENVIRONMENT:
      [{
        keys: ['environment'],
        value: config.JIRA_CONFIG.ISSUE_ENVIRONMENT
      }],
    ISSUE_DESCRIPTION:
      [{
        keys: ['description'],
        value: `${issueDescription}`
      }],
    ISSUE_DUE_DATE:
      [{
        keys: ['duedate'],
        value: config.JIRA_CONFIG.ISSUE_DUE_DATE
      }],
    ISSUE_FIX_VERSIONS:
      [{
        keys: ['fixVersions'],
        value: config.JIRA_CONFIG.ISSUE_FIX_VERSIONS
      }],
    ISSUE_COMPONENTS:
      [{
        keys: ['components'],
        value: config.JIRA_CONFIG.ISSUE_COMPONENTS
      }],
    ISSUE_SEVERITY_MAP:
      [{
        keys: ['priority', 'name'],
        value: `${severityMap}`
      }]
  };
};

module.exports = {
  templateBluePrint: templateBluePrint
};
