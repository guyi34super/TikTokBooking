import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { logger } from '../utils/logger';
import { PaymentService } from '../services/payment-service';
import { BookingCreatedEvent, BookingCancelledEvent } from '../types/events';

// Initialize Kafka
const kafka = new Kafka({
  clientId: 'payment-service',
  brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
  ssl: process.env.KAFKA_SSL === 'true',
  sasl: process.env.KAFKA_SASL_MECHANISM
    ? {
        mechanism: process.env.KAFKA_SASL_MECHANISM as any,
        username: process.env.KAFKA_SASL_USERNAME || '',
        password: process.env.KAFKA_SASL_PASSWORD || '',
      }
    : undefined,
});

const consumer: Consumer = kafka.consumer({
  groupId: 'payment-service-group',
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
});

// Idempotency tracking (in production, use Redis or database)
const processedEvents = new Set<string>();

// Payment service instance
const paymentService = new PaymentService();

/**
 * Check if event has already been processed (idempotency)
 */
async function isEventProcessed(eventId: string): Promise<boolean> {
  // In production, check Redis or database
  // return await redis.exists(`processed:${eventId}`);
  return processedEvents.has(eventId);
}

/**
 * Mark event as processed
 */
async function markEventProcessed(eventId: string): Promise<void> {
  // In production, store in Redis with TTL
  // await redis.setex(`processed:${eventId}`, 86400, '1');
  processedEvents.add(eventId);
}

/**
 * Handle booking.booking.created event
 * Creates a payment intent for the new booking
 */
async function handleBookingCreated(event: BookingCreatedEvent): Promise<void> {
  logger.info('Processing booking.created event', {
    eventId: event.event_id,
    bookingId: event.data.booking_id,
  });

  try {
    // Create payment intent
    const payment = await paymentService.createPaymentIntent({
      bookingId: event.data.booking_id,
      userId: event.data.user_id,
      amount: event.data.price_amount,
      currency: event.data.price_currency,
      metadata: {
        productId: event.data.product_id,
        correlationId: event.correlation_id,
      },
    });

    logger.info('Payment intent created', {
      eventId: event.event_id,
      bookingId: event.data.booking_id,
      paymentId: payment.id,
    });
  } catch (error) {
    logger.error('Failed to create payment intent', {
      eventId: event.event_id,
      bookingId: event.data.booking_id,
      error,
    });
    throw error; // Will trigger retry
  }
}

/**
 * Handle booking.booking.cancelled event
 * Processes refund if applicable
 */
async function handleBookingCancelled(event: BookingCancelledEvent): Promise<void> {
  logger.info('Processing booking.cancelled event', {
    eventId: event.event_id,
    bookingId: event.data.booking_id,
  });

  try {
    // Check if refund is eligible
    if (!event.data.refund_eligible || !event.data.payment_id) {
      logger.info('Booking not eligible for refund', {
        eventId: event.event_id,
        bookingId: event.data.booking_id,
      });
      return;
    }

    // Process refund
    const refund = await paymentService.createRefund({
      paymentId: event.data.payment_id,
      amount: event.data.refund_amount,
      currency: event.data.refund_currency,
      reason: event.data.cancellation_reason,
    });

    logger.info('Refund processed', {
      eventId: event.event_id,
      bookingId: event.data.booking_id,
      paymentId: event.data.payment_id,
      refundId: refund.id,
    });
  } catch (error) {
    logger.error('Failed to process refund', {
      eventId: event.event_id,
      bookingId: event.data.booking_id,
      error,
    });
    throw error; // Will trigger retry
  }
}

/**
 * Route event to appropriate handler
 */
async function processEvent(message: EachMessagePayload): Promise<void> {
  const { topic, partition, message: kafkaMessage } = message;

  if (!kafkaMessage.value) {
    logger.warn('Received message without value', { topic, partition });
    return;
  }

  let event: any;
  try {
    event = JSON.parse(kafkaMessage.value.toString());
  } catch (error) {
    logger.error('Failed to parse message', { topic, partition, error });
    return; // Skip malformed messages
  }

  // Idempotency check
  if (await isEventProcessed(event.event_id)) {
    logger.info('Event already processed, skipping', {
      eventId: event.event_id,
      eventType: event.event_type,
    });
    return;
  }

  // Route to handler based on event type
  try {
    switch (event.event_type) {
      case 'booking.booking.created':
        await handleBookingCreated(event);
        break;

      case 'booking.booking.cancelled':
        await handleBookingCancelled(event);
        break;

      default:
        logger.warn('Unknown event type', {
          eventId: event.event_id,
          eventType: event.event_type,
        });
    }

    // Mark as processed
    await markEventProcessed(event.event_id);

    logger.info('Event processed successfully', {
      eventId: event.event_id,
      eventType: event.event_type,
    });
  } catch (error) {
    logger.error('Failed to process event', {
      eventId: event.event_id,
      eventType: event.event_type,
      error,
    });
    throw error; // Will trigger Kafka retry
  }
}

/**
 * Start the Kafka consumer
 */
export async function startConsumer(): Promise<void> {
  try {
    // Connect to Kafka
    await consumer.connect();
    logger.info('Connected to Kafka');

    // Subscribe to topics
    await consumer.subscribe({
      topics: ['booking.booking.created', 'booking.booking.cancelled'],
      fromBeginning: false,
    });
    logger.info('Subscribed to topics');

    // Start consuming messages
    await consumer.run({
      eachMessage: async (payload) => {
        try {
          await processEvent(payload);
        } catch (error) {
          logger.error('Error processing message', {
            topic: payload.topic,
            partition: payload.partition,
            offset: payload.message.offset,
            error,
          });
          // Error will be handled by Kafka retry mechanism
          throw error;
        }
      },
    });

    logger.info('Payment consumer started successfully');
  } catch (error) {
    logger.error('Failed to start consumer', { error });
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
export async function stopConsumer(): Promise<void> {
  try {
    await consumer.disconnect();
    logger.info('Consumer disconnected');
  } catch (error) {
    logger.error('Error disconnecting consumer', { error });
  }
}

// Handle shutdown signals
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await stopConsumer();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await stopConsumer();
  process.exit(0);
});

// Start consumer if running directly
if (require.main === module) {
  startConsumer();
}
