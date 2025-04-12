// Format successful response
const success = (body) => {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    };
  };
  // Format error response
  const error = (statusCode, message) => {
    return {
      statusCode: statusCode || 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: message || 'Internal Server Error'
      })
    };
  };
  module.exports = {
    success,
    error
  };
  
 