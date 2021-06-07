const got = require('got');

const POSTRequestWrapper = async (
  requestName,
  hostName,
  apiPath,
  acceptHeaderValue,
  authToken,
  postData
) => {
  try {
    const response = await got.post(`${hostName}${apiPath}`, {
      json: postData,
      retry: 0,
      responseType: 'json',
      headers: {
        'Content-Type': acceptHeaderValue,
        Cookie: authToken
      }
    });
    return response;
  } catch (error) {
    console.log(
      `POST request ${requestName} encountered the following error: ${error.message}`
    );
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
    console.log(
      `DELETE request ${requestName} encountered the following error: ${error.message}`
    );
    return error;
  }
};

module.exports = {
  POSTRequestWrapper: POSTRequestWrapper,
  DELETERequestWrapper: DELETERequestWrapper
};
