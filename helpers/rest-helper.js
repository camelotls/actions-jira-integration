import got from 'got';
import bunyan from 'bunyan';
import { fixJiraURI } from '../utils/helper.js';

const log = bunyan.createLogger({ name: 'actions-jira-integration' });

export const POSTRequestWrapper = async (
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
      retry: { limit: 0 },
      responseType: 'json',
      headers: {
        'Content-Type': acceptHeaderValue
      }
    };

    if (authToken !== '') {
      options.headers.Cookie = authToken;
    }

    const response = await got.post(`${fixJiraURI(hostName)}${apiPath}`, options);

    return response;
  } catch (error) {
    log.warn(`POST request ${requestName} encountered the following error: ${error.message}`);

    if (error.response && error.response.body) {
      error.response.body.errorMessages.forEach(message => log.warn(message));
      log.warn(error.response.body.errors);
    }

    return error;
  }
};

export const DELETERequestWrapper = async (
  requestName,
  hostName,
  apiPath,
  acceptHeaderValue,
  authToken
) => {
  try {
    const response = await got.delete(`${fixJiraURI(hostName)}${apiPath}`, {
      retry: { limit: 0 },
      headers: {
        'Content-Type': acceptHeaderValue,
        Cookie: authToken
      }
    });

    return response;
  } catch (error) {
    log.warn(`DELETE request ${requestName} encountered the following error: ${error.message}`);

    if (error.response && error.response.body) {
      error.response.body.errorMessages.forEach(message => log.warn(message));
      log.warn(error.response.body.errors);
    }

    return error;
  }
};
