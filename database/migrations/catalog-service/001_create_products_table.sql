-- Migration: Create products and categories tables
-- Service: Catalog Service
-- Description: Product/service catalog with categories

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for product type
CREATE TYPE product_type AS ENUM (
    'product',
    'service',
    'appointment',
    'event'
);

-- Create categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    icon VARCHAR(255),
    
    -- Display order
    sort_order INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_active ON categories(is_active);

-- Create products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic info
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    short_description VARCHAR(500),
    
    -- Type and categorization
    type product_type NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    
    -- Provider (if applicable)
    provider_id UUID,
    
    -- Pricing
    price_amount DECIMAL(19, 4) NOT NULL CHECK (price_amount >= 0),
    price_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    
    -- Comparison price (for showing discounts)
    compare_at_price DECIMAL(19, 4),
    
    -- Inventory (null = unlimited)
    inventory INTEGER CHECK (inventory >= 0),
    track_inventory BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Availability
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    available_from TIMESTAMPTZ,
    available_until TIMESTAMPTZ,
    
    -- Media
    images JSONB DEFAULT '[]',
    -- Example: [{"url": "...", "alt": "...", "sort_order": 1}]
    
    -- Duration (for services/appointments)
    duration_minutes INTEGER,
    
    -- Location requirements
    requires_location BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    -- Example: {"features": [...], "specifications": {...}, "booking_rules": {...}}
    
    -- SEO
    seo_title VARCHAR(255),
    seo_description VARCHAR(500),
    
    -- Status
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_type ON products(type);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_provider ON products(provider_id);
CREATE INDEX idx_products_available ON products(is_available, is_published);
CREATE INDEX idx_products_price ON products(price_amount);
CREATE INDEX idx_products_created ON products(created_at DESC);
CREATE INDEX idx_products_metadata ON products USING GIN (metadata);

-- Full-text search index
CREATE INDEX idx_products_search ON products USING GIN (
    to_tsvector('english', 
        COALESCE(name, '') || ' ' || 
        COALESCE(description, '') || ' ' || 
        COALESCE(short_description, '')
    )
);

-- Create product variants table (for products with options like size, color)
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE,
    
    -- Pricing (overrides base product price if set)
    price_amount DECIMAL(19, 4),
    price_currency VARCHAR(3),
    
    -- Inventory
    inventory INTEGER,
    
    -- Variant options
    options JSONB DEFAULT '{}',
    -- Example: {"size": "Large", "color": "Red"}
    
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_variants_product ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku);

-- Create availability schedules table (for appointments/services)
CREATE TABLE availability_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    provider_id UUID,
    
    -- Day of week (0 = Sunday, 6 = Saturday)
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
    
    -- Time slots
    start_time TIME NOT NULL,
    end_time TIME NOT NULL CHECK (end_time > start_time),
    
    -- Capacity per slot
    capacity INTEGER DEFAULT 1,
    
    -- Date range (null = ongoing)
    valid_from DATE,
    valid_until DATE,
    
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_availability_schedules_product ON availability_schedules(product_id);
CREATE INDEX idx_availability_schedules_provider ON availability_schedules(provider_id);
CREATE INDEX idx_availability_schedules_day ON availability_schedules(day_of_week);

-- Triggers
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at
    BEFORE UPDATE ON product_variants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_availability_schedules_updated_at
    BEFORE UPDATE ON availability_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE products IS 'Product and service catalog';
COMMENT ON TABLE categories IS 'Hierarchical product categories';
COMMENT ON TABLE product_variants IS 'Product variants (size, color, etc.)';
COMMENT ON TABLE availability_schedules IS 'Availability schedules for bookable services';
