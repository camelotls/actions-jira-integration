const got = require('got');
const bunyan = require('bunyan');
const log = bunyan.createLogger({ name: 'actions-jira-integration' });

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

    const response = await got.post(`${hostName}${apiPath}`, options);

    return response;
  } catch (error) {
    log.warn(`POST request ${requestName} encountered the following error: ${error.message}`);
    return error;
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
    const response = await got.delete(`${hostName}${apiPath}`, {
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
