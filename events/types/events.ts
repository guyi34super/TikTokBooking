/**
 * Event Type Definitions
 * 
 * This file contains TypeScript interfaces for all Kafka events in the system.
 * These types ensure type safety when producing and consuming events.
 */

// ============================================================================
// Base Event Structure
// ============================================================================

export interface BaseEvent<T> {
  event_id: string;
  event_type: string;
  event_version: string;
  timestamp: string;
  correlation_id: string;
  data: T;
  metadata?: {
    source: string;
    [key: string]: any;
  };
}

// ============================================================================
// Booking Events
// ============================================================================

export interface BookingCreatedData {
  booking_id: string;
  user_id: string;
  product_id: string;
  provider_id?: string;
  start_time: string;
  end_time?: string;
  quantity: number;
  price_amount: number;
  price_currency: string;
  status: 'PENDING';
  location?: {
    lat: number;
    lon: number;
    address?: string;
  };
  metadata: Record<string, any>;
}

export type BookingCreatedEvent = BaseEvent<BookingCreatedData>;

export interface BookingConfirmedData {
  booking_id: string;
  user_id: string;
  product_id: string;
  payment_id: string;
  confirmed_at: string;
  price_amount: number;
  price_currency: string;
}

export type BookingConfirmedEvent = BaseEvent<BookingConfirmedData>;

export interface BookingCancelledData {
  booking_id: string;
  user_id: string;
  product_id: string;
  payment_id?: string;
  cancelled_at: string;
  cancellation_reason: string;
  refund_eligible: boolean;
  refund_amount?: number;
  refund_currency?: string;
}

export type BookingCancelledEvent = BaseEvent<BookingCancelledData>;

export interface BookingUpdatedData {
  booking_id: string;
  user_id: string;
  changes: Record<string, any>;
  updated_at: string;
}

export type BookingUpdatedEvent = BaseEvent<BookingUpdatedData>;

// ============================================================================
// Payment Events
// ============================================================================

export interface PaymentCreatedData {
  payment_id: string;
  booking_id: string;
  user_id: string;
  amount: number;
  currency: string;
  provider: 'stripe' | 'paypal' | 'manual';
  created_at: string;
}

export type PaymentCreatedEvent = BaseEvent<PaymentCreatedData>;

export interface PaymentSucceededData {
  payment_id: string;
  booking_id: string;
  user_id: string;
  amount: number;
  currency: string;
  provider: 'stripe' | 'paypal' | 'manual';
  provider_payment_id: string;
  payment_method: {
    type: string;
    brand?: string;
    last4?: string;
  };
  succeeded_at: string;
}

export type PaymentSucceededEvent = BaseEvent<PaymentSucceededData>;

export interface PaymentFailedData {
  payment_id: string;
  booking_id: string;
  user_id: string;
  amount: number;
  currency: string;
  provider: 'stripe' | 'paypal' | 'manual';
  error_code: string;
  error_message: string;
  failed_at: string;
}

export type PaymentFailedEvent = BaseEvent<PaymentFailedData>;

export interface PaymentRefundedData {
  payment_id: string;
  booking_id: string;
  user_id: string;
  refund_id: string;
  refund_amount: number;
  currency: string;
  reason?: string;
  refunded_at: string;
}

export type PaymentRefundedEvent = BaseEvent<PaymentRefundedData>;

// ============================================================================
// Receipt Events
// ============================================================================

export interface ReceiptGeneratedData {
  receipt_id: string;
  payment_id: string;
  booking_id: string;
  user_id: string;
  receipt_number: string;
  receipt_url: string;
  amount: number;
  currency: string;
  generated_at: string;
}

export type ReceiptGeneratedEvent = BaseEvent<ReceiptGeneratedData>;

// ============================================================================
// User Events
// ============================================================================

export interface UserCreatedData {
  user_id: string;
  email: string;
  name: string;
  auth_providers: Array<{
    provider: string;
    sub: string;
  }>;
  created_at: string;
}

export type UserCreatedEvent = BaseEvent<UserCreatedData>;

export interface UserUpdatedData {
  user_id: string;
  changes: Record<string, any>;
  updated_at: string;
}

export type UserUpdatedEvent = BaseEvent<UserUpdatedData>;

// ============================================================================
// Notification Events
// ============================================================================

export interface EmailSentData {
  notification_id: string;
  user_id: string;
  email: string;
  template: string;
  subject: string;
  sent_at: string;
  status: 'sent' | 'failed';
}

export type EmailSentEvent = BaseEvent<EmailSentData>;

export interface SMSSentData {
  notification_id: string;
  user_id: string;
  phone: string;
  message: string;
  sent_at: string;
  status: 'sent' | 'failed';
}

export type SMSSentEvent = BaseEvent<SMSSentData>;

// ============================================================================
// Analytics Events
// ============================================================================

export interface EventTrackedData {
  event_name: string;
  user_id?: string;
  booking_id?: string;
  payment_id?: string;
  properties: Record<string, any>;
  tracked_at: string;
}

export type EventTrackedEvent = BaseEvent<EventTrackedData>;

// ============================================================================
// Type Guards
// ============================================================================

export function isBookingCreatedEvent(event: any): event is BookingCreatedEvent {
  return event.event_type === 'booking.booking.created';
}

export function isPaymentSucceededEvent(event: any): event is PaymentSucceededEvent {
  return event.event_type === 'payment.payment.succeeded';
}

export function isReceiptGeneratedEvent(event: any): event is ReceiptGeneratedEvent {
  return event.event_type === 'receipt.receipt.generated';
}
