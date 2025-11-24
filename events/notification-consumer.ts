import { Kafka, Consumer } from 'kafkajs';
import { OrderCreatedEvent, OrderPaidEvent, KAFKA_TOPICS } from './order-events';

const kafka = new Kafka({
  clientId: 'notification-service',
  brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
});

const consumer: Consumer = kafka.consumer({ groupId: 'notification-group' });

async function sendEmailNotification(to: string, subject: string, body: string) {
  // Implement email sending (e.g., using SendGrid, AWS SES)
  console.log(`Sending email to ${to}: ${subject}`);
  // await emailService.send({ to, subject, body });
}

async function handleOrderCreated(event: OrderCreatedEvent) {
  console.log('Processing order.created event:', event.event_id);
  
  // Send order confirmation email
  await sendEmailNotification(
    event.data.user_id, // In real app, fetch user email
    'Order Confirmation',
    `Your order ${event.data.order_id} has been created. Total: $${event.data.total_amount}`
  );
}

async function handleOrderPaid(event: OrderPaidEvent) {
  console.log('Processing order.paid event:', event.event_id);
  
  // Send payment confirmation email
  await sendEmailNotification(
    event.data.user_id,
    'Payment Confirmed',
    `Your payment of $${event.data.amount} for order ${event.data.order_id} has been received.`
  );
}

export async function startNotificationConsumer() {
  await consumer.connect();
  console.log('Notification consumer connected');

  await consumer.subscribe({
    topics: [KAFKA_TOPICS.ORDER_CREATED, KAFKA_TOPICS.ORDER_PAID],
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const event = JSON.parse(message.value!.toString());

      try {
        switch (topic) {
          case KAFKA_TOPICS.ORDER_CREATED:
            await handleOrderCreated(event);
            break;
          case KAFKA_TOPICS.ORDER_PAID:
            await handleOrderPaid(event);
            break;
        }
      } catch (error) {
        console.error('Error processing event:', error);
      }
    },
  });
}

export async function stopNotificationConsumer() {
  await consumer.disconnect();
}
