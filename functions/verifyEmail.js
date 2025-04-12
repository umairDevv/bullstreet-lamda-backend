const { getRental, isRentalValid } = require('../utils/dynamodb');
const { success, error } = require('../utils/response');
module.exports.handler = async (event) => {
  try {
    // Parse request body
    const requestBody = JSON.parse(event.body);
    const { email, movieId } = requestBody;
    if (!email || !movieId) {
      return error(400, 'Email and movieId are required');
    }
    // Get rental record
    const rental = await getRental(email, movieId);
    if (!rental) {
      return error(404, 'No rental found for this email and movie');
    }
    // Check if rental is still valid
    const valid = await isRentalValid(email, movieId);
    if (!valid) {
      return error(403, 'Rental period has expired');
    }
    // Return success with video URL and access token
    return success({
      access: 'granted',
      email: rental.email,
      movieId: rental.movieId,
      accessToken: rental.accessToken,
      videoUrl: process.env.VIDEO_URL,
      rentalEndTime: rental.rentalEndTime,
      // Calculate remaining time in hours and minutes
      remainingTime: {
        hours: Math.floor((rental.rentalEndTime - Date.now()) / (1000 * 60 * 60)),
        minutes: Math.floor(((rental.rentalEndTime - Date.now()) % (1000 * 60 * 60)) / (1000 * 60))
      }
    });
  } catch (err) {
    console.error('Error verifying email:', err);
    return error(500, err.message);
  }
};

