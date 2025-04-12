const { getRental, isRentalValid } = require('../utils/dynamodb');
const { success, error } = require('../utils/response');
module.exports.handler = async (event) => {
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

