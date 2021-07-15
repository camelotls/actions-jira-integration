const { expect, assert } = require('chai');
const { describe, it, before, after } = require('mocha');
const rewire = require('rewire');
const index = rewire('../../index');
const fs = require('fs');

require('dotenv').config();

const ghUsername = process.env.GH_USER;
const ghToken = process.env.GH_TOKEN;
const dockerodeFacade = require('../utils/dockerodeFacade');

const kickOffAction = index.__get__('kickOffAction');

describe('Jira Issues from NPM Audit', () => {
  let containerId;

  before(function (done) {
    this.timeout(60000);
    dockerodeFacade.pullImageAndSpawnContainer(
      done,
      (contId) => (containerId = contId),
      { username: ghUsername, password: ghToken }
    );
  });

  it('should create a Jira ticket from an NPM Audit report with one vulnerability', () => {

  });

  after(function (done) {
    this.timeout(20000);
    dockerodeFacade.stopAndRemoveContainer(done, containerId);
  });
});
