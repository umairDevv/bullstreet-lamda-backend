const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { success, error } = require('../utils/response');
module.exports.handler = async (event) => {
  try {
    // Parse request body
    const requestBody = JSON.parse(event.body);
    const { email, movieId, rentalType,amount} = requestBody;
    if (!email || !movieId) {
      return error(400, 'Email and movieId are required');
    }
    // Set price based on quality (HD or UHD)
    let priceAmount = amount; // $4.99 for HD by default
    let priceDescription = 'Bull Street Movie Rental (HD) - 48 Hours';
    if (rentalType === 'UHD') {
      priceAmount = amount; // $6.99 for UHD
      priceDescription = 'Bull Street Movie Rental (UHD) - 48 Hours';
    }
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: priceDescription,
              images: ['https://mainlinestudios-website.s3.us-east-1.amazonaws.com/poster.png'],
            },
            unit_amount: priceAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      allow_promotion_codes: true,
      success_url: `https://watchbullstreet.com/checkout-success?movie-id=${movieId}&rental-type=${rentalType}`,
      cancel_url: `https://watchbullstreet.com/checkout?movie-id=${movieId}&rental-type=${rentalType}`,
      customer_email: email,
      metadata: {
        email,
        movieId,
      }
    });
    // Return checkout session ID
    return success({
      sessionId: session.id,
      url: session.url
    });
  } catch (err) {
    console.error('Error creating checkout session:', err);
    return error(500, err.message);
  }
};