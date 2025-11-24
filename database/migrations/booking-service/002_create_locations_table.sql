-- Migration: Create locations table
-- Service: Booking Service
-- Description: Store location information with Google Maps integration

CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Coordinates
    latitude DECIMAL(10, 8) NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
    longitude DECIMAL(11, 8) NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
    
    -- Address components
    address TEXT,
    city VARCHAR(255),
    state VARCHAR(255),
    country VARCHAR(2), -- ISO 3166-1 alpha-2
    postal_code VARCHAR(20),
    
    -- Google Maps integration
    place_id VARCHAR(255),
    formatted_address TEXT,
    
    -- Additional metadata
    metadata JSONB DEFAULT '{}',
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create spatial index for geolocation queries
CREATE INDEX idx_locations_coordinates ON locations(latitude, longitude);
CREATE INDEX idx_locations_place_id ON locations(place_id);
CREATE INDEX idx_locations_country ON locations(country);

-- Add foreign key to bookings table
ALTER TABLE bookings
ADD CONSTRAINT fk_bookings_location
FOREIGN KEY (location_id) REFERENCES locations(id)
ON DELETE SET NULL;

COMMENT ON TABLE locations IS 'Location data with Google Maps integration';
COMMENT ON COLUMN locations.place_id IS 'Google Maps Place ID for canonical reference';
