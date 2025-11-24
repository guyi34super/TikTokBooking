import React, { useState, useCallback, useRef } from 'react';
import { GoogleMap, Marker, Autocomplete, useJsApiLoader } from '@react-google-maps/api';

const libraries: ('places' | 'drawing' | 'geometry' | 'visualization')[] = ['places'];

interface MapPickerProps {
  onLocationSelect: (location: {
    lat: number;
    lon: number;
    address?: string;
    place_id?: string;
  }) => void;
  initialLocation?: {
    lat: number;
    lon: number;
    address?: string;
  } | null;
}

const mapContainerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '8px',
};

const defaultCenter = {
  lat: 37.7749, // San Francisco
  lng: -122.4194,
};

export const MapPicker: React.FC<MapPickerProps> = ({
  onLocationSelect,
  initialLocation,
}) => {
  const [selectedPosition, setSelectedPosition] = useState<google.maps.LatLngLiteral>(
    initialLocation
      ? { lat: initialLocation.lat, lng: initialLocation.lon }
      : defaultCenter
  );
  const [address, setAddress] = useState<string>(initialLocation?.address || '');
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const handleMapClick = useCallback(
    (event: google.maps.MapMouseEvent) => {
      if (!event.latLng) return;

      const lat = event.latLng.lat();
      const lng = event.latLng.lng();

      setSelectedPosition({ lat, lng });

      // Reverse geocoding to get address
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const formattedAddress = results[0].formatted_address;
          const placeId = results[0].place_id;
          setAddress(formattedAddress);

          onLocationSelect({
            lat,
            lon: lng,
            address: formattedAddress,
            place_id: placeId,
          });
        } else {
          onLocationSelect({ lat, lon: lng });
        }
      });
    },
    [onLocationSelect]
  );

  const onAutocompleteLoad = (autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();

      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        setSelectedPosition({ lat, lng });
        setAddress(place.formatted_address || '');

        if (map) {
          map.panTo({ lat, lng });
          map.setZoom(15);
        }

        onLocationSelect({
          lat,
          lon: lng,
          address: place.formatted_address,
          place_id: place.place_id,
        });
      }
    }
  };

  if (loadError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        Error loading Google Maps. Please check your API key.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-64 bg-gray-100 rounded-md">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <Autocomplete onLoad={onAutocompleteLoad} onPlaceChanged={onPlaceChanged}>
        <input
          type="text"
          placeholder="Search for a location..."
          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          defaultValue={address}
        />
      </Autocomplete>

      {/* Map */}
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={selectedPosition}
        zoom={13}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClick}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        }}
      >
        {selectedPosition && <Marker position={selectedPosition} />}
      </GoogleMap>

      {/* Selected Address Display */}
      {address && (
        <div className="bg-blue-50 border border-blue-200 px-4 py-3 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Selected location:</strong> {address}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Coordinates: {selectedPosition.lat.toFixed(6)}, {selectedPosition.lng.toFixed(6)}
          </p>
        </div>
      )}

      <p className="text-sm text-gray-500">
        Click on the map or search for a location to set the booking location.
      </p>
    </div>
  );
};
