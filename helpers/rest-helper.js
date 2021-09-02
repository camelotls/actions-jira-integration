const got = require('got');
const bunyan = require('bunyan');
const log = bunyan.createLogger({ name: 'actions-jira-integration' });
const utils = require('../utils/helper');

const POSTRequestWrapper = async (
  requestName,
  hostName,
  apiPath,
  acceptHeaderValue,
  authToken,
  postData
) => {
  try {
    const options = {
      json: postData,
      retry: 0,
      responseType: 'json',
      headers: {
        'Content-Type': acceptHeaderValue
      }
    };

    if (authToken !== '') {
      options.headers.Cookie = authToken;
    }

    const response = await got.post(`${utils.fixJiraURI(hostName)}${apiPath}`, options);

    return response;
  } catch (error) {
    if (error.response && error.response.body) {
      error.response.body.errorMessages.forEach(msg => console.log(msg));
      console.log( error.response.body.errors);
    }
  }
};

const DELETERequestWrapper = async (
  requestName,
  hostName,
  apiPath,
  acceptHeaderValue,
  authToken
) => {
  try {
    const response = await got.delete(`${utils.fixJiraURI(hostName)}${apiPath}`, {
      retry: 0,
      headers: {
        'Content-Type': acceptHeaderValue,
        Cookie: authToken
      }
    });

    return response;
  } catch (error) {
    log.warn(`DELETE request ${requestName} encountered the following error: ${error.message}`);
    return error;
  }
};

module.exports = {
  POSTRequestWrapper: POSTRequestWrapper,
  DELETERequestWrapper: DELETERequestWrapper
};
