-- Migration: Create payments table
-- Service: Payment Service
-- Description: Store payment transactions and processing status

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for payment status
CREATE TYPE payment_status AS ENUM (
    'CREATED',
    'PROCESSING',
    'SUCCEEDED',
    'FAILED',
    'REFUNDED',
    'PARTIALLY_REFUNDED'
);

-- Create enum for payment provider
CREATE TYPE payment_provider AS ENUM (
    'stripe',
    'paypal',
    'apple_pay',
    'google_pay',
    'manual'
);

-- Create payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- References
    booking_id UUID NOT NULL,
    user_id UUID NOT NULL,
    
    -- Provider information
    provider payment_provider NOT NULL,
    provider_payment_id VARCHAR(255), -- External payment ID from provider
    provider_customer_id VARCHAR(255), -- Customer ID in payment provider
    
    -- Amount details
    amount DECIMAL(19, 4) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) NOT NULL,
    
    -- Refund tracking
    refunded_amount DECIMAL(19, 4) DEFAULT 0 CHECK (refunded_amount >= 0),
    
    -- Status
    status payment_status NOT NULL DEFAULT 'CREATED',
    
    -- Payment method details (card brand, last4, etc.)
    method JSONB DEFAULT '{}',
    
    -- Client secret for frontend (Stripe)
    client_secret TEXT,
    
    -- Error information
    error_code VARCHAR(100),
    error_message TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    succeeded_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_provider_payment_id ON payments(provider, provider_payment_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX idx_payments_user_status ON payments(user_id, status);

-- Unique constraint to prevent duplicate provider payment IDs
CREATE UNIQUE INDEX idx_payments_provider_payment_unique 
ON payments(provider, provider_payment_id) 
WHERE provider_payment_id IS NOT NULL;

-- Create payment events log table for audit trail
CREATE TABLE payment_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL DEFAULT '{}',
    
    -- Provider webhook data
    provider_event_id VARCHAR(255),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payment_events_payment_id ON payment_events(payment_id);
CREATE INDEX idx_payment_events_type ON payment_events(event_type);
CREATE INDEX idx_payment_events_created ON payment_events(created_at DESC);

-- Create refunds table
CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    
    amount DECIMAL(19, 4) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL,
    
    reason TEXT,
    status payment_status NOT NULL DEFAULT 'PROCESSING',
    
    -- Provider refund ID
    provider_refund_id VARCHAR(255),
    
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_refunds_payment_id ON refunds(payment_id);
CREATE INDEX idx_refunds_status ON refunds(status);

-- Trigger for updated_at
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_refunds_updated_at
    BEFORE UPDATE ON refunds
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE payments IS 'Payment transactions for bookings';
COMMENT ON TABLE payment_events IS 'Audit log of all payment-related events';
COMMENT ON TABLE refunds IS 'Refund requests and processing';
COMMENT ON COLUMN payments.provider_payment_id IS 'PaymentIntent ID (Stripe) or equivalent';
COMMENT ON COLUMN payments.method IS 'Payment method details (card brand, last4, wallet type)';
COMMENT ON COLUMN payments.client_secret IS 'Client secret for frontend confirmation (Stripe)';
