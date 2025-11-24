import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { logger } from '../utils/logger';
import { NotificationService } from '../services/notification-service';
import {
  BookingCreatedEvent,
  BookingConfirmedEvent,
  BookingCancelledEvent,
  PaymentSucceededEvent,
  PaymentFailedEvent,
  ReceiptGeneratedEvent,
} from '../types/events';

const kafka = new Kafka({
  clientId: 'notification-service',
  brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
});

const consumer: Consumer = kafka.consumer({
  groupId: 'notification-service-group',
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
});

const notificationService = new NotificationService();
const processedEvents = new Set<string>();

async function isEventProcessed(eventId: string): Promise<boolean> {
  return processedEvents.has(eventId);
}

async function markEventProcessed(eventId: string): Promise<void> {
  processedEvents.add(eventId);
}

/**
 * Send booking confirmation notification
 */
async function handleBookingCreated(event: BookingCreatedEvent): Promise<void> {
  logger.info('Sending booking created notification', {
    eventId: event.event_id,
    bookingId: event.data.booking_id,
    userId: event.data.user_id,
  });

  await notificationService.sendEmail({
    userId: event.data.user_id,
    template: 'booking-created',
    subject: 'Booking Confirmation - Payment Required',
    data: {
      bookingId: event.data.booking_id,
      productId: event.data.product_id,
      startTime: event.data.start_time,
      endTime: event.data.end_time,
      amount: event.data.price_amount,
      currency: event.data.price_currency,
    },
  });
}

/**
 * Send booking confirmed notification
 */
async function handleBookingConfirmed(event: BookingConfirmedEvent): Promise<void> {
  logger.info('Sending booking confirmed notification', {
    eventId: event.event_id,
    bookingId: event.data.booking_id,
    userId: event.data.user_id,
  });

  // Send email
  await notificationService.sendEmail({
    userId: event.data.user_id,
    template: 'booking-confirmed',
    subject: 'Your Booking is Confirmed!',
    data: {
      bookingId: event.data.booking_id,
      confirmedAt: event.data.confirmed_at,
      amount: event.data.price_amount,
      currency: event.data.price_currency,
    },
  });

  // Send SMS (optional)
  await notificationService.sendSMS({
    userId: event.data.user_id,
    message: `Your booking has been confirmed! Booking ID: ${event.data.booking_id.substring(0, 8)}`,
  });

  // Send push notification (optional)
  await notificationService.sendPush({
    userId: event.data.user_id,
    title: 'Booking Confirmed',
    body: 'Your booking has been confirmed. Check your email for details.',
    data: {
      bookingId: event.data.booking_id,
      type: 'booking_confirmed',
    },
  });
}

/**
 * Send booking cancelled notification
 */
async function handleBookingCancelled(event: BookingCancelledEvent): Promise<void> {
  logger.info('Sending booking cancelled notification', {
    eventId: event.event_id,
    bookingId: event.data.booking_id,
    userId: event.data.user_id,
  });

  await notificationService.sendEmail({
    userId: event.data.user_id,
    template: 'booking-cancelled',
    subject: 'Booking Cancelled',
    data: {
      bookingId: event.data.booking_id,
      cancelledAt: event.data.cancelled_at,
      reason: event.data.cancellation_reason,
      refundEligible: event.data.refund_eligible,
      refundAmount: event.data.refund_amount,
      refundCurrency: event.data.refund_currency,
    },
  });
}

/**
 * Send payment success notification
 */
async function handlePaymentSucceeded(event: PaymentSucceededEvent): Promise<void> {
  logger.info('Sending payment succeeded notification', {
    eventId: event.event_id,
    paymentId: event.data.payment_id,
    userId: event.data.user_id,
  });

  await notificationService.sendEmail({
    userId: event.data.user_id,
    template: 'payment-succeeded',
    subject: 'Payment Successful',
    data: {
      paymentId: event.data.payment_id,
      bookingId: event.data.booking_id,
      amount: event.data.amount,
      currency: event.data.currency,
      paymentMethod: event.data.payment_method,
    },
  });
}

/**
 * Send payment failed notification
 */
async function handlePaymentFailed(event: PaymentFailedEvent): Promise<void> {
  logger.info('Sending payment failed notification', {
    eventId: event.event_id,
    paymentId: event.data.payment_id,
    userId: event.data.user_id,
  });

  await notificationService.sendEmail({
    userId: event.data.user_id,
    template: 'payment-failed',
    subject: 'Payment Failed - Action Required',
    data: {
      paymentId: event.data.payment_id,
      bookingId: event.data.booking_id,
      amount: event.data.amount,
      currency: event.data.currency,
      errorMessage: event.data.error_message,
    },
  });
}

/**
 * Send receipt via email
 */
async function handleReceiptGenerated(event: ReceiptGeneratedEvent): Promise<void> {
  logger.info('Sending receipt', {
    eventId: event.event_id,
    receiptId: event.data.receipt_id,
    userId: event.data.user_id,
  });

  await notificationService.sendEmail({
    userId: event.data.user_id,
    template: 'receipt',
    subject: `Receipt ${event.data.receipt_number}`,
    data: {
      receiptId: event.data.receipt_id,
      receiptNumber: event.data.receipt_number,
      receiptUrl: event.data.receipt_url,
      bookingId: event.data.booking_id,
      amount: event.data.amount,
      currency: event.data.currency,
    },
    attachments: [
      {
        filename: `receipt-${event.data.receipt_number}.pdf`,
        path: event.data.receipt_url,
      },
    ],
  });
}

/**
 * Process incoming event
 */
async function processEvent(message: EachMessagePayload): Promise<void> {
  const { topic, message: kafkaMessage } = message;

  if (!kafkaMessage.value) {
    logger.warn('Received message without value', { topic });
    return;
  }

  const event = JSON.parse(kafkaMessage.value.toString());

  if (await isEventProcessed(event.event_id)) {
    logger.info('Event already processed', { eventId: event.event_id });
    return;
  }

  try {
    switch (event.event_type) {
      case 'booking.booking.created':
        await handleBookingCreated(event);
        break;

      case 'booking.booking.confirmed':
        await handleBookingConfirmed(event);
        break;

      case 'booking.booking.cancelled':
        await handleBookingCancelled(event);
        break;

      case 'payment.payment.succeeded':
        await handlePaymentSucceeded(event);
        break;

      case 'payment.payment.failed':
        await handlePaymentFailed(event);
        break;

      case 'receipt.receipt.generated':
        await handleReceiptGenerated(event);
        break;

      default:
        logger.warn('Unknown event type', { eventType: event.event_type });
    }

    await markEventProcessed(event.event_id);
    logger.info('Event processed successfully', { eventId: event.event_id });
  } catch (error) {
    logger.error('Failed to process event', { eventId: event.event_id, error });
    throw error;
  }
}

/**
 * Start the notification consumer
 */
export async function startConsumer(): Promise<void> {
  await consumer.connect();
  logger.info('Notification consumer connected to Kafka');

  await consumer.subscribe({
    topics: [
      'booking.booking.created',
      'booking.booking.confirmed',
      'booking.booking.cancelled',
      'payment.payment.succeeded',
      'payment.payment.failed',
      'receipt.receipt.generated',
    ],
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: processEvent,
  });

  logger.info('Notification consumer started');
}

export async function stopConsumer(): Promise<void> {
  await consumer.disconnect();
  logger.info('Notification consumer stopped');
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  await stopConsumer();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await stopConsumer();
  process.exit(0);
});

if (require.main === module) {
  startConsumer();
}
