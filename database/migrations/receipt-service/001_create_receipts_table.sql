-- Migration: Create receipts table
-- Service: Receipt Service
-- Description: Store generated receipts and invoices

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for receipt status
CREATE TYPE receipt_status AS ENUM (
    'PENDING',
    'GENERATED',
    'SENT',
    'FAILED'
);

-- Create receipts table
CREATE TABLE receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- References
    payment_id UUID NOT NULL,
    booking_id UUID NOT NULL,
    user_id UUID NOT NULL,
    
    -- Receipt details
    receipt_number VARCHAR(50) NOT NULL UNIQUE,
    invoice_number VARCHAR(50),
    
    -- Amounts
    amount DECIMAL(19, 4) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    tax_amount DECIMAL(19, 4) DEFAULT 0,
    tax_rate DECIMAL(5, 4), -- e.g., 0.0825 for 8.25%
    
    -- Storage
    s3_bucket VARCHAR(255),
    s3_key VARCHAR(1024),
    s3_url TEXT,
    
    -- File details
    file_format VARCHAR(10) DEFAULT 'pdf', -- pdf, html
    file_size_bytes INTEGER,
    
    -- Status
    status receipt_status NOT NULL DEFAULT 'PENDING',
    
    -- Email tracking
    emailed_to VARCHAR(255),
    email_sent_at TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    -- Example: {"company": {...}, "customer": {...}, "line_items": [...], "notes": "..."}
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    generated_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX idx_receipts_payment_id ON receipts(payment_id);
CREATE INDEX idx_receipts_booking_id ON receipts(booking_id);
CREATE INDEX idx_receipts_user_id ON receipts(user_id);
CREATE INDEX idx_receipts_receipt_number ON receipts(receipt_number);
CREATE INDEX idx_receipts_status ON receipts(status);
CREATE INDEX idx_receipts_created_at ON receipts(created_at DESC);

-- Sequence for receipt numbers (if using sequential numbering)
CREATE SEQUENCE receipt_number_seq START 1000;

-- Function to generate receipt number
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    next_num INTEGER;
    year VARCHAR(4);
    receipt_num VARCHAR(50);
BEGIN
    next_num := nextval('receipt_number_seq');
    year := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;
    receipt_num := 'RCP-' || year || '-' || LPAD(next_num::VARCHAR, 6, '0');
    RETURN receipt_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate receipt number
CREATE OR REPLACE FUNCTION set_receipt_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.receipt_number IS NULL THEN
        NEW.receipt_number := generate_receipt_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_receipts_receipt_number
    BEFORE INSERT ON receipts
    FOR EACH ROW
    EXECUTE FUNCTION set_receipt_number();

-- Trigger for updated_at
CREATE TRIGGER update_receipts_updated_at
    BEFORE UPDATE ON receipts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE receipts IS 'Generated receipts and invoices for payments';
COMMENT ON COLUMN receipts.receipt_number IS 'Unique receipt identifier for customers';
COMMENT ON COLUMN receipts.invoice_number IS 'Optional invoice number for business transactions';
COMMENT ON COLUMN receipts.s3_url IS 'Public or signed URL to download receipt PDF';
COMMENT ON COLUMN receipts.metadata IS 'Complete receipt data including line items';
