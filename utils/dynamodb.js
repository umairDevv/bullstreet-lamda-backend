const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'movie-rentals';
// Create a new rental record
const createRental = async (email, movieId, paymentId) => {
  const now = Date.now();
  const rentalPeriodHours = parseInt(process.env.RENTAL_PERIOD_HOURS || '48');
  const rentalEndTime = now + (rentalPeriodHours * 60 * 60 * 1000);
  const params = {
    TableName: TABLE_NAME,
    Item: {
      email,
      movieId,
      rentalStartTime: now,
      rentalEndTime,
      paymentId,
      paymentStatus: 'paid',
      accessToken: generateAccessToken()
    }
  };
  try {
    await dynamoDb.put(params).promise();
    return params.Item;
  } catch (error) {
    console.error('Error creating rental record:', error);
    throw error;
  }
};
// Get rental by email and movieId
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
// Check if a rental is still valid (within the 48-hour period)
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
// Generate a random access token
const generateAccessToken = () => {
  return require('crypto').randomBytes(32).toString('hex');
};
module.exports = {
  createRental,
  getRental,
  isRentalValid
};

