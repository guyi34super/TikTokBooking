-- Migration: Create bookings table
-- Service: Booking Service
-- Description: Core table for storing booking reservations

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for booking status
CREATE TYPE booking_status AS ENUM (
    'PENDING',
    'CONFIRMED',
    'CANCELLED',
    'COMPLETED',
    'FAILED'
);

-- Create bookings table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    product_id UUID NOT NULL,
    provider_id UUID,
    
    -- Timing
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    
    -- Booking details
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    status booking_status NOT NULL DEFAULT 'PENDING',
    
    -- Pricing
    price_amount DECIMAL(19, 4) NOT NULL CHECK (price_amount >= 0),
    price_currency VARCHAR(3) NOT NULL,
    
    -- References
    payment_id UUID,
    location_id UUID,
    
    -- Flexible metadata
    metadata JSONB DEFAULT '{}',
    
    -- Optimistic locking
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Audit timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

-- Create indexes for common queries
CREATE INDEX idx_bookings_user_id ON bookings(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_bookings_product_id ON bookings(product_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_bookings_provider_id ON bookings(provider_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_bookings_payment_id ON bookings(payment_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_bookings_status ON bookings(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_bookings_start_time ON bookings(start_time) WHERE deleted_at IS NULL;
CREATE INDEX idx_bookings_created_at ON bookings(created_at DESC) WHERE deleted_at IS NULL;

-- Composite indexes for common query patterns
CREATE INDEX idx_bookings_user_status ON bookings(user_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_bookings_provider_start ON bookings(provider_id, start_time) WHERE deleted_at IS NULL;
CREATE INDEX idx_bookings_product_start ON bookings(product_id, start_time) WHERE deleted_at IS NULL;

-- Index for metadata queries (GIN index for JSONB)
CREATE INDEX idx_bookings_metadata ON bookings USING GIN (metadata);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE bookings IS 'Core table storing all booking reservations';
COMMENT ON COLUMN bookings.id IS 'Unique booking identifier';
COMMENT ON COLUMN bookings.user_id IS 'Reference to user making the booking';
COMMENT ON COLUMN bookings.product_id IS 'Reference to product/service being booked';
COMMENT ON COLUMN bookings.provider_id IS 'Optional provider for service bookings';
COMMENT ON COLUMN bookings.start_time IS 'Booking start time';
COMMENT ON COLUMN bookings.end_time IS 'Booking end time (null for instant bookings)';
COMMENT ON COLUMN bookings.quantity IS 'Number of items/slots booked';
COMMENT ON COLUMN bookings.status IS 'Current booking status';
COMMENT ON COLUMN bookings.price_amount IS 'Total booking price';
COMMENT ON COLUMN bookings.price_currency IS 'ISO 4217 currency code';
COMMENT ON COLUMN bookings.payment_id IS 'Reference to payment record';
COMMENT ON COLUMN bookings.location_id IS 'Reference to location (optional)';
COMMENT ON COLUMN bookings.metadata IS 'Flexible JSONB field for booking-specific data';
COMMENT ON COLUMN bookings.version IS 'Version number for optimistic locking';
COMMENT ON COLUMN bookings.deleted_at IS 'Soft delete timestamp';
