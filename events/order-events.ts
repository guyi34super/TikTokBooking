// Kafka Event Definitions for Order System

export interface OrderCreatedEvent {
  event_type: 'order.created';
  event_id: string;
  timestamp: string;
  data: {
    order_id: string;
    user_id: string;
    items: Array<{
      product_id: string;
      product_name: string;
      quantity: number;
      price: number;
    }>;
    total_amount: number;
    currency: string;
  };
}

export interface OrderPaidEvent {
  event_type: 'order.paid';
  event_id: string;
  timestamp: string;
  data: {
    order_id: string;
    user_id: string;
    payment_id: string;
    amount: number;
    currency: string;
    payment_method: string;
    paid_at: string;
  };
}

export interface OrderStatusChangedEvent {
  event_type: 'order.status_changed';
  event_id: string;
  timestamp: string;
  data: {
    order_id: string;
    old_status: string;
    new_status: string;
    reason?: string;
  };
}

export interface PaymentFailedEvent {
  event_type: 'payment.failed';
  event_id: string;
  timestamp: string;
  data: {
    order_id: string;
    user_id: string;
    amount: number;
    error_message: string;
  };
}

// Kafka Topics
export const KAFKA_TOPICS = {
  ORDER_CREATED: 'order.created',
  ORDER_PAID: 'order.paid',
  ORDER_STATUS_CHANGED: 'order.status_changed',
  PAYMENT_FAILED: 'payment.failed',
} as const;
