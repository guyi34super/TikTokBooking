const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy');
const { Kafka } = require('kafkajs');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3004;

const kafka = new Kafka({
  clientId: 'payment-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(',')
});
const producer = kafka.producer();

app.use(cors());
app.use(express.json());

// POST /payments/create
app.post('/payments/create', async (req, res) => {
  try {
    const { booking_id, amount, currency } = req.body;
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency || 'usd',
      metadata: { booking_id }
    });
    
    res.json({
      payment_id: paymentIntent.id,
      client_secret: paymentIntent.client_secret,
      status: paymentIntent.status
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// POST /webhooks/stripe
app.post('/webhooks/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || 'whsec_dummy'
    );
    
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      
      // Emit Kafka event
      try {
        await producer.connect();
        await producer.send({
          topic: 'payment.succeeded',
          messages: [{
            value: JSON.stringify({
              booking_id: paymentIntent.metadata.booking_id,
              payment_id: paymentIntent.id,
              amount: paymentIntent.amount / 100
            })
          }]
        });
        console.log('✅ Emitted payment.succeeded event');
      } catch (kafkaError) {
        console.log('⚠️ Kafka not available');
      }
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error(error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`✅ PAYMENT SERVICE running on port ${PORT}`);
});
