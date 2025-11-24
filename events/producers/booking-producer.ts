import { Kafka, Producer, Message } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { BookingCreatedEvent, BookingConfirmedEvent, BookingCancelledEvent } from '../types/events';

const kafka = new Kafka({
  clientId: 'booking-service',
  brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
});

const producer: Producer = kafka.producer({
  idempotent: true, // Ensures exactly-once semantics
  maxInFlightRequests: 5,
  transactionalId: 'booking-service-producer',
});

let isConnected = false;

/**
 * Connect to Kafka
 */
export async function connectProducer(): Promise<void> {
  if (isConnected) return;

  try {
    await producer.connect();
    isConnected = true;
    logger.info('Booking producer connected to Kafka');
  } catch (error) {
    logger.error('Failed to connect producer', { error });
    throw error;
  }
}

/**
 * Disconnect from Kafka
 */
export async function disconnectProducer(): Promise<void> {
  if (!isConnected) return;

  try {
    await producer.disconnect();
    isConnected = false;
    logger.info('Booking producer disconnected');
  } catch (error) {
    logger.error('Failed to disconnect producer', { error });
  }
}

/**
 * Base function to send event to Kafka
 */
async function sendEvent<T>(
  topic: string,
  key: string,
  event: T,
  headers?: Record<string, string>
): Promise<void> {
  if (!isConnected) {
    await connectProducer();
  }

  const message: Message = {
    key,
    value: JSON.stringify(event),
    headers: headers || {},
    timestamp: new Date().toISOString(),
  };

  try {
    const result = await producer.send({
      topic,
      messages: [message],
      acks: -1, // Wait for all in-sync replicas
    });

    logger.info('Event sent successfully', {
      topic,
      key,
      partition: result[0].partition,
      offset: result[0].offset,
    });
  } catch (error) {
    logger.error('Failed to send event', { topic, key, error });
    throw error;
  }
}

/**
 * Publish booking.booking.created event
 */
export async function publishBookingCreated(data: {
  bookingId: string;
  userId: string;
  productId: string;
  providerId?: string;
  startTime: string;
  endTime?: string;
  quantity: number;
  priceAmount: number;
  priceCurrency: string;
  location?: {
    lat: number;
    lon: number;
    address?: string;
  };
  metadata?: any;
  correlationId?: string;
}): Promise<void> {
  const event: BookingCreatedEvent = {
    event_id: uuidv4(),
    event_type: 'booking.booking.created',
    event_version: '1.0',
    timestamp: new Date().toISOString(),
    correlation_id: data.correlationId || uuidv4(),
    data: {
      booking_id: data.bookingId,
      user_id: data.userId,
      product_id: data.productId,
      provider_id: data.providerId,
      start_time: data.startTime,
      end_time: data.endTime,
      quantity: data.quantity,
      price_amount: data.priceAmount,
      price_currency: data.priceCurrency,
      status: 'PENDING',
      location: data.location,
      metadata: data.metadata || {},
    },
    metadata: {
      source: 'booking-service',
    },
  };

  await sendEvent('booking.booking.created', data.bookingId, event);
}

/**
 * Publish booking.booking.confirmed event
 */
export async function publishBookingConfirmed(data: {
  bookingId: string;
  userId: string;
  productId: string;
  paymentId: string;
  priceAmount: number;
  priceCurrency: string;
  correlationId?: string;
}): Promise<void> {
  const event: BookingConfirmedEvent = {
    event_id: uuidv4(),
    event_type: 'booking.booking.confirmed',
    event_version: '1.0',
    timestamp: new Date().toISOString(),
    correlation_id: data.correlationId || uuidv4(),
    data: {
      booking_id: data.bookingId,
      user_id: data.userId,
      product_id: data.productId,
      payment_id: data.paymentId,
      confirmed_at: new Date().toISOString(),
      price_amount: data.priceAmount,
      price_currency: data.priceCurrency,
    },
    metadata: {
      source: 'booking-service',
    },
  };

  await sendEvent('booking.booking.confirmed', data.bookingId, event);
}

/**
 * Publish booking.booking.cancelled event
 */
export async function publishBookingCancelled(data: {
  bookingId: string;
  userId: string;
  productId: string;
  paymentId?: string;
  cancellationReason: string;
  refundEligible: boolean;
  refundAmount?: number;
  refundCurrency?: string;
  correlationId?: string;
}): Promise<void> {
  const event: BookingCancelledEvent = {
    event_id: uuidv4(),
    event_type: 'booking.booking.cancelled',
    event_version: '1.0',
    timestamp: new Date().toISOString(),
    correlation_id: data.correlationId || uuidv4(),
    data: {
      booking_id: data.bookingId,
      user_id: data.userId,
      product_id: data.productId,
      payment_id: data.paymentId,
      cancelled_at: new Date().toISOString(),
      cancellation_reason: data.cancellationReason,
      refund_eligible: data.refundEligible,
      refund_amount: data.refundAmount,
      refund_currency: data.refundCurrency,
    },
    metadata: {
      source: 'booking-service',
    },
  };

  await sendEvent('booking.booking.cancelled', data.bookingId, event);
}

/**
 * Publish booking.booking.updated event
 */
export async function publishBookingUpdated(data: {
  bookingId: string;
  userId: string;
  changes: Record<string, any>;
  correlationId?: string;
}): Promise<void> {
  const event = {
    event_id: uuidv4(),
    event_type: 'booking.booking.updated',
    event_version: '1.0',
    timestamp: new Date().toISOString(),
    correlation_id: data.correlationId || uuidv4(),
    data: {
      booking_id: data.bookingId,
      user_id: data.userId,
      changes: data.changes,
      updated_at: new Date().toISOString(),
    },
    metadata: {
      source: 'booking-service',
    },
  };

  await sendEvent('booking.booking.updated', data.bookingId, event);
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  await disconnectProducer();
});

process.on('SIGINT', async () => {
  await disconnectProducer();
});
