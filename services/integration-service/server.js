const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const { Kafka } = require('kafkajs');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3008;

const kafka = new Kafka({
  clientId: 'integration-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(',')
});
const consumer = kafka.consumer({ groupId: 'integration-group' });

app.use(cors());
app.use(express.json());

// Hash function for user data (privacy)
function hashData(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Send event to TikTok
async function sendToTikTok(eventData) {
  const payload = {
    pixel_code: process.env.TIKTOK_PIXEL_ID,
    event: "CompletePayment",
    event_id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    context: {
      user: {
        email: hashData(eventData.user_email || 'user@example.com'),
        phone_number: hashData(eventData.user_phone || '1234567890')
      }
    },
    properties: {
      content_type: "product",
      value: eventData.amount,
      currency: eventData.currency || "USD",
      contents: eventData.items || []
    }
  };
  
  try {
    const response = await axios.post(
      process.env.TIKTOK_EVENT_API_URL || 'https://business-api.tiktok.com/open_api/v1.3/event/track/',
      payload,
      {
        headers: {
          'Access-Token': process.env.TIKTOK_ACCESS_TOKEN,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ TikTok event sent:', payload.event_id);
    return response.data;
  } catch (error) {
    console.error('❌ TikTok API error:', error.message);
    throw error;
  }
}

// Listen to Kafka events
async function startConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'payment.succeeded', fromBeginning: false });
  
  await consumer.run({
    eachMessage: async ({ message }) => {
      const event = JSON.parse(message.value.toString());
      console.log('📥 Received payment.succeeded event:', event.booking_id);
      
      try {
        await sendToTikTok({
          booking_id: event.booking_id,
          amount: event.amount,
          currency: 'USD',
          user_email: 'user@example.com',
          items: []
        });
      } catch (error) {
        console.error('Failed to send to TikTok:', error.message);
      }
    }
  });
}

// Manual event tracking endpoint
app.post('/tiktok/track', async (req, res) => {
  try {
    const result = await sendToTikTok(req.body);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`✅ INTEGRATION SERVICE (TikTok) running on port ${PORT}`);
  startConsumer().catch(console.error);
});
