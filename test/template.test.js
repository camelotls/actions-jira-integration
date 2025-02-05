import { expect } from 'chai';
import { describe, it } from 'mocha';

import { MOCK_JIRA_ISSUE_DESCRIPTION_RAW_STRING, MOCK_JIRA_ISSUE_DESCRIPTION_ADF_STRING } from './mocks/template-mock.js';

import { MOCK_JIRA_ISSUE_SUMMARY } from './mocks/jira-helper-mock.js';

import { blueprint } from '../utils/template.js';

describe('should create jira issues regardless of description type', () => {
  it('with plain string description', () => {
    const blp = blueprint(
      MOCK_JIRA_ISSUE_SUMMARY,
      MOCK_JIRA_ISSUE_DESCRIPTION_RAW_STRING,
      'P1'
    );
    expect(blp)
      .to.be.instanceOf(Object)
      .to.have.all.keys(
        'description',
        'summary',
        'issuetype.name',
        'priority.name',
        'project.key'
      );
    expect(blp.description).to.deep.equal(MOCK_JIRA_ISSUE_DESCRIPTION_ADF_STRING);
  });

  it('with ADF string description', () => {
    const blp = blueprint(
      MOCK_JIRA_ISSUE_SUMMARY,
      JSON.stringify(MOCK_JIRA_ISSUE_DESCRIPTION_ADF_STRING),
      'P1'
    );
    expect(blp)
      .to.be.instanceOf(Object)
      .to.have.all.keys(
        'description',
        'summary',
        'issuetype.name',
        'priority.name',
        'project.key'
      );
    expect(blp.description).to.deep.equal(MOCK_JIRA_ISSUE_DESCRIPTION_ADF_STRING);
  });
});
