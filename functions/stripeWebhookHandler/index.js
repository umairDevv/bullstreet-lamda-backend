const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const dynamoDb = new AWS.DynamoDB.DocumentClient();

// const { createRental } = require('../utils/dynamodb');
// const { success, error } = require('../utils/response');

//  /webhook


module.exports.handler = async (event) => {
  const TABLE_NAME = 'movie-rentals';

  const generateAccessToken = () => {
    return require('crypto').randomBytes(32).toString('hex');
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





  // Format error response

  try {
    // Get the Stripe signature from the headers
    const signature = event.headers['stripe-signature'];
    // Verify that this is a legitimate Stripe request
    let stripeEvent;
    try {
      stripeEvent = stripe.webhooks.constructEvent(
        event.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return error(400, `Webhook Error: ${err.message}`);
    }
    // Log the event for debugging
    console.log('Stripe Event:', JSON.stringify(stripeEvent));
    // Handle the checkout.session.completed event
    if (stripeEvent.type === 'checkout.session.completed') {
      const session = stripeEvent.data.object;
      // Get metadata from the session
      const { email, movieId } = session.metadata;
      if (!email || !movieId) {
        console.error('Missing email or movieId in session metadata');
        return error(400, 'Missing required metadata');
      }
      // Create a rental record in DynamoDB
      const rental = await createRental(email, movieId, session.id);
      return success({
        access: 'granted',
        email: rental.email,
        movieId: rental.movieId,
        accessToken: rental.accessToken,
        rentalEndTime: rental.rentalEndTime
      });
    }
    // Default success response for other events
    return success({ received: true });
  } catch (err) {
    console.error('Error processing webhook:', err);
    return error(500, err.message);
  }
};