# Kafka Topics and Events

This document defines all Kafka topics and event schemas for the booking microservices architecture.

## Topic Naming Convention

Format: `{service}.{entity}.{action}`

Example: `booking.booking.created`

## Topics Overview

| Topic Name | Producer | Consumers | Retention | Partitions |
|------------|----------|-----------|-----------|------------|
| `booking.booking.created` | Booking Service | Payment, Notification, Analytics | 7 days | 3 |
| `booking.booking.updated` | Booking Service | Notification, Analytics | 7 days | 3 |
| `booking.booking.cancelled` | Booking Service | Payment, Notification, Analytics | 7 days | 3 |
| `booking.booking.confirmed` | Booking Service | Notification, Receipt, Analytics | 7 days | 3 |
| `payment.payment.created` | Payment Service | Booking, Analytics | 7 days | 3 |
| `payment.payment.succeeded` | Payment Service | Booking, Receipt, Notification, Analytics | 30 days | 3 |
| `payment.payment.failed` | Payment Service | Booking, Notification, Analytics | 30 days | 3 |
| `payment.payment.refunded` | Payment Service | Booking, Notification, Analytics | 30 days | 3 |
| `receipt.receipt.generated` | Receipt Service | Notification, Analytics | 30 days | 2 |
| `notification.email.sent` | Notification Service | Analytics | 3 days | 2 |
| `notification.sms.sent` | Notification Service | Analytics | 3 days | 2 |
| `analytics.event.tracked` | Analytics Service | Third-Party Integration | 90 days | 5 |
| `user.user.created` | User Service | Notification, Analytics | 7 days | 2 |
| `user.user.updated` | User Service | Analytics | 7 days | 2 |

---

## Event Schemas

### 1. booking.booking.created

**Producer:** Booking Service  
**Consumers:** Payment Service, Notification Service, Analytics Service

**Schema:**
```json
{
  "event_id": "uuid",
  "event_type": "booking.booking.created",
  "event_version": "1.0",
  "timestamp": "2025-11-24T10:30:00Z",
  "correlation_id": "uuid",
  "data": {
    "booking_id": "uuid",
    "user_id": "uuid",
    "product_id": "uuid",
    "provider_id": "uuid",
    "start_time": "2025-12-01T14:00:00Z",
    "end_time": "2025-12-01T15:00:00Z",
    "quantity": 1,
    "price_amount": 99.99,
    "price_currency": "USD",
    "status": "PENDING",
    "location": {
      "lat": 37.7749,
      "lon": -122.4194,
      "address": "123 Main St, San Francisco, CA"
    },
    "metadata": {}
  },
  "metadata": {
    "source": "booking-service",
    "user_agent": "Mozilla/5.0...",
    "ip_address": "192.168.1.1"
  }
}
```

---

### 2. booking.booking.confirmed

**Producer:** Booking Service  
**Consumers:** Notification Service, Receipt Service, Analytics Service

**Schema:**
```json
{
  "event_id": "uuid",
  "event_type": "booking.booking.confirmed",
  "event_version": "1.0",
  "timestamp": "2025-11-24T10:35:00Z",
  "correlation_id": "uuid",
  "data": {
    "booking_id": "uuid",
    "user_id": "uuid",
    "product_id": "uuid",
    "payment_id": "uuid",
    "confirmed_at": "2025-11-24T10:35:00Z",
    "price_amount": 99.99,
    "price_currency": "USD"
  },
  "metadata": {
    "source": "booking-service"
  }
}
```

---

### 3. booking.booking.cancelled

**Producer:** Booking Service  
**Consumers:** Payment Service (for refunds), Notification Service, Analytics Service

**Schema:**
```json
{
  "event_id": "uuid",
  "event_type": "booking.booking.cancelled",
  "event_version": "1.0",
  "timestamp": "2025-11-24T11:00:00Z",
  "correlation_id": "uuid",
  "data": {
    "booking_id": "uuid",
    "user_id": "uuid",
    "product_id": "uuid",
    "payment_id": "uuid",
    "cancelled_at": "2025-11-24T11:00:00Z",
    "cancellation_reason": "User requested",
    "refund_eligible": true,
    "refund_amount": 99.99,
    "refund_currency": "USD"
  },
  "metadata": {
    "source": "booking-service",
    "cancelled_by": "user"
  }
}
```

---

### 4. payment.payment.succeeded

**Producer:** Payment Service  
**Consumers:** Booking Service, Receipt Service, Notification Service, Analytics Service

**Schema:**
```json
{
  "event_id": "uuid",
  "event_type": "payment.payment.succeeded",
  "event_version": "1.0",
  "timestamp": "2025-11-24T10:35:00Z",
  "correlation_id": "uuid",
  "data": {
    "payment_id": "uuid",
    "booking_id": "uuid",
    "user_id": "uuid",
    "amount": 99.99,
    "currency": "USD",
    "provider": "stripe",
    "provider_payment_id": "pi_xxxxxxxxxxxxx",
    "payment_method": {
      "type": "card",
      "brand": "visa",
      "last4": "4242"
    },
    "succeeded_at": "2025-11-24T10:35:00Z"
  },
  "metadata": {
    "source": "payment-service"
  }
}
```

---

### 5. payment.payment.failed

**Producer:** Payment Service  
**Consumers:** Booking Service, Notification Service, Analytics Service

**Schema:**
```json
{
  "event_id": "uuid",
  "event_type": "payment.payment.failed",
  "event_version": "1.0",
  "timestamp": "2025-11-24T10:35:00Z",
  "correlation_id": "uuid",
  "data": {
    "payment_id": "uuid",
    "booking_id": "uuid",
    "user_id": "uuid",
    "amount": 99.99,
    "currency": "USD",
    "provider": "stripe",
    "error_code": "card_declined",
    "error_message": "Your card was declined",
    "failed_at": "2025-11-24T10:35:00Z"
  },
  "metadata": {
    "source": "payment-service"
  }
}
```

---

### 6. receipt.receipt.generated

**Producer:** Receipt Service  
**Consumers:** Notification Service, Analytics Service

**Schema:**
```json
{
  "event_id": "uuid",
  "event_type": "receipt.receipt.generated",
  "event_version": "1.0",
  "timestamp": "2025-11-24T10:36:00Z",
  "correlation_id": "uuid",
  "data": {
    "receipt_id": "uuid",
    "payment_id": "uuid",
    "booking_id": "uuid",
    "user_id": "uuid",
    "receipt_number": "RCP-2025-001234",
    "receipt_url": "https://s3.amazonaws.com/receipts/...",
    "amount": 99.99,
    "currency": "USD",
    "generated_at": "2025-11-24T10:36:00Z"
  },
  "metadata": {
    "source": "receipt-service"
  }
}
```

---

## Event Standards

### Common Event Structure

All events follow this base structure:

```typescript
interface BaseEvent<T> {
  event_id: string;           // UUID for event tracking
  event_type: string;          // Topic name (e.g., "booking.booking.created")
  event_version: string;       // Schema version (e.g., "1.0")
  timestamp: string;           // ISO 8601 timestamp
  correlation_id: string;      // For tracing related events
  data: T;                     // Event-specific payload
  metadata?: {                 // Optional metadata
    source: string;            // Source service name
    [key: string]: any;
  };
}
```

### Idempotency

All consumers MUST implement idempotency using `event_id` to prevent duplicate processing.

### Message Keys

Kafka messages should use these keys for partitioning:
- Booking events: `booking_id`
- Payment events: `payment_id`
- User events: `user_id`

This ensures all events for the same entity go to the same partition, maintaining order.

### Dead Letter Queue (DLQ)

Failed events after 3 retries should be sent to `{topic}.dlq` for manual investigation.

---

## Consumer Groups

| Consumer Group | Topics Subscribed | Service |
|----------------|-------------------|---------|
| `payment-service-group` | `booking.booking.created`, `booking.booking.cancelled` | Payment Service |
| `notification-service-group` | `booking.booking.*`, `payment.payment.*`, `receipt.receipt.generated` | Notification Service |
| `receipt-service-group` | `payment.payment.succeeded` | Receipt Service |
| `analytics-service-group` | All topics | Analytics Service |
| `integration-service-group` | `analytics.event.tracked` | Third-Party Integration Service |

---

## Monitoring & Alerts

### Key Metrics to Monitor

1. **Consumer Lag**: Alert if lag > 1000 messages
2. **Processing Time**: Alert if p99 > 5 seconds
3. **Error Rate**: Alert if error rate > 1%
4. **DLQ Size**: Alert if DLQ has > 10 messages
5. **Throughput**: Monitor messages/sec per topic

### Prometheus Metrics

```
kafka_consumer_lag{topic, consumer_group}
kafka_consumer_processing_duration_seconds{topic, consumer_group}
kafka_consumer_errors_total{topic, consumer_group}
kafka_dlq_messages_total{topic}
```
