import { expect } from 'chai';
import { describe, it } from 'mocha';
import { fixJiraURI } from '../utils/helper.js';

describe('REST helper functions are working as expected', () => {
  it('should fix the JIRA host uri by prepending https as the protocol if none is provided', () => {
    const jiraURIToFix = 'jira.host.com';
    const fixedURI = fixJiraURI(jiraURIToFix);
    expect(fixedURI).to.equal(`https://${jiraURIToFix}`);
  });

  it('should not prepend anything if the protocol is already set to https', () => {
    const jiraURIWithHttps = 'https://jira.host.com';
    const notFixedURI = fixJiraURI(jiraURIWithHttps);
    expect(notFixedURI).to.equal(jiraURIWithHttps);
  });

  it('should not prepend anything if the protocol is already set to http', () => {
    const jiraURIWithHttp = 'http://jira.host.com';
    const notFixedURI = fixJiraURI(jiraURIWithHttp);
    expect(notFixedURI).to.equal(jiraURIWithHttp);
  });
});
