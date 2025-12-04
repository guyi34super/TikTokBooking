import { Kafka, Producer } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';
import { OrderCreatedEvent, OrderPaidEvent, OrderStatusChangedEvent, KAFKA_TOPICS } from './order-events';

const kafka = new Kafka({
  clientId: 'order-service',
  brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
});

const producer: Producer = kafka.producer();

export async function connectProducer() {
  await producer.connect();
  console.log('Kafka producer connected');
}

export async function disconnectProducer() {
  await producer.disconnect();
}

// Publish order created event
export async function publishOrderCreated(orderData: OrderCreatedEvent['data']) {
  const event: OrderCreatedEvent = {
    event_type: 'order.created',
    event_id: uuidv4(),
    timestamp: new Date().toISOString(),
    data: orderData,
  };

  await producer.send({
    topic: KAFKA_TOPICS.ORDER_CREATED,
    messages: [
      {
        key: orderData.order_id,
        value: JSON.stringify(event),
      },
    ],
  });

  console.log('Published order.created event:', event.event_id);
}

// Publish order paid event
export async function publishOrderPaid(paymentData: OrderPaidEvent['data']) {
  const event: OrderPaidEvent = {
    event_type: 'order.paid',
    event_id: uuidv4(),
    timestamp: new Date().toISOString(),
    data: paymentData,
  };

  await producer.send({
    topic: KAFKA_TOPICS.ORDER_PAID,
    messages: [
      {
        key: paymentData.order_id,
        value: JSON.stringify(event),
      },
    ],
  });

  console.log('Published order.paid event:', event.event_id);
}

// Publish order status changed event
export async function publishOrderStatusChanged(statusData: OrderStatusChangedEvent['data']) {
  const event: OrderStatusChangedEvent = {
    event_type: 'order.status_changed',
    event_id: uuidv4(),
    timestamp: new Date().toISOString(),
    data: statusData,
  };

  await producer.send({
    topic: KAFKA_TOPICS.ORDER_STATUS_CHANGED,
    messages: [
      {
        key: statusData.order_id,
        value: JSON.stringify(event),
      },
    ],
  });

  console.log('Published order.status_changed event:', event.event_id);
}
