// const { getRental, isRentalValid } = require('../utils/dynamodb');
// const { success, error } = require('../utils/response');



//zip not needed as not modules are here.
// " /check-rental"

const dynamoDb = new AWS.DynamoDB.DocumentClient();


module.exports.handler = async (event) => {

  const TABLE_NAME = 'movie-rentals';

  const getRental = async (email, movieId) => {
    const params = {
      TableName: TABLE_NAME,
      Key: {
        email,
        movieId
      }
    };
    try {
      const result = await dynamoDb.get(params).promise();
      return result.Item;
    } catch (error) {
      console.error('Error getting rental record:', error);
      throw error;
    }
  };
const isRentalValid = async (email, movieId) => {
  try {
    const rental = await getRental(email, movieId);
    if (!rental) {
      return false;
    }
    const now = Date.now();
    return rental.rentalEndTime > now;
  } catch (error) {
    console.error('Error checking rental validity:', error);
    throw error;
  }
};








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







  try {
    // Get query string parameters
    const queryParams = event.queryStringParameters || {};
    const { email, movieId, accessToken } = queryParams;
    if (!email || !movieId || !accessToken) {
      return error(400, 'Email, movieId, and accessToken are required');
    }
    // Get rental record
    const rental = await getRental(email, movieId);
    if (!rental) {
      return error(404, 'No rental found for this email and movie');
    }
    // Verify access token
    if (rental.accessToken !== accessToken) {
      return error(403, 'Invalid access token');
    }
    // Check if rental is still valid
    const valid = await isRentalValid(email, movieId);
    if (!valid) {
      return error(403, 'Rental period has expired');
    }
    // Return success with video URL
    return success({
      access: 'granted',
      videoUrl: process.env.VIDEO_URL,
      rentalEndTime: rental.rentalEndTime,
      // Calculate remaining time in hours and minutes
      remainingTime: {
        hours: Math.floor((rental.rentalEndTime - Date.now()) / (1000 * 60 * 60)),
        minutes: Math.floor(((rental.rentalEndTime - Date.now()) % (1000 * 60 * 60)) / (1000 * 60))
      }
    });
  } catch (err) {
    console.error('Error checking rental status:', err);
    return error(500, err.message);
  }
};

