// server.js

const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');

require('dotenv').config();

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());

app.post('/create-checkout-session', async (req, res) => {
  const { amount } = req.body;

  if (!amount || amount < 1) {
    return res.status(400).json({ error: 'Invalid donation amount' });
  }

  try {
    // Create a product for the subscription
    const product = await stripe.products.create({
      name: 'Monthly Donation',
    });

    // Create a recurring price based on user input (in cents)
    const price = await stripe.prices.create({
      unit_amount: parseInt(amount * 100), // Convert dollars to cents
      currency: 'usd',
      recurring: { interval: 'month' },
      product: product.id,
    });

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      success_url: 'https://yourwebsite.com/success',
      cancel_url: 'https://yourwebsite.com/cancel',
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
