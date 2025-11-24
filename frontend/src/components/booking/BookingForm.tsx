import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createBooking } from '../../services/api';
import { MapPicker } from '../maps/MapPicker';

// Validation schema
const bookingSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  start_time: z.string().datetime('Invalid date and time'),
  end_time: z.string().datetime('Invalid date and time').optional(),
  quantity: z.number().min(1, 'Quantity must be at least 1').default(1),
  location: z.object({
    lat: z.number(),
    lon: z.number(),
    address: z.string().optional(),
    place_id: z.string().optional(),
  }).optional(),
  metadata: z.object({
    notes: z.string().optional(),
    special_requests: z.array(z.string()).optional(),
  }).optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingFormProps {
  productId: string;
  productName: string;
  productPrice: number;
  productCurrency: string;
  requiresLocation?: boolean;
  onSuccess?: (bookingId: string) => void;
}

export const BookingForm: React.FC<BookingFormProps> = ({
  productId,
  productName,
  productPrice,
  productCurrency,
  requiresLocation = false,
  onSuccess,
}) => {
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lon: number;
    address?: string;
    place_id?: string;
  } | null>(null);

  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      product_id: productId,
      quantity: 1,
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      onSuccess?.(data.id);
    },
    onError: (error: any) => {
      console.error('Booking creation failed:', error);
      alert(error.response?.data?.message || 'Failed to create booking');
    },
  });

  const onSubmit = (data: BookingFormData) => {
    if (requiresLocation && !selectedLocation) {
      alert('Please select a location');
      return;
    }

    const bookingData = {
      ...data,
      location: selectedLocation || undefined,
    };

    createBookingMutation.mutate(bookingData);
  };

  const handleLocationSelect = (location: {
    lat: number;
    lon: number;
    address?: string;
    place_id?: string;
  }) => {
    setSelectedLocation(location);
    setValue('location', location);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Book {productName}</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Date and Time Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date & Time *
            </label>
            <input
              type="datetime-local"
              {...register('start_time')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.start_time && (
              <p className="text-red-500 text-sm mt-1">{errors.start_time.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date & Time
            </label>
            <input
              type="datetime-local"
              {...register('end_time')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.end_time && (
              <p className="text-red-500 text-sm mt-1">{errors.end_time.message}</p>
            )}
          </div>
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantity *
          </label>
          <input
            type="number"
            min="1"
            {...register('quantity', { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.quantity && (
            <p className="text-red-500 text-sm mt-1">{errors.quantity.message}</p>
          )}
        </div>

        {/* Location Picker */}
        {requiresLocation && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location *
            </label>
            <MapPicker
              onLocationSelect={handleLocationSelect}
              initialLocation={selectedLocation}
            />
            {!selectedLocation && (
              <p className="text-gray-500 text-sm mt-1">
                Please select a location on the map
              </p>
            )}
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Special Notes
          </label>
          <textarea
            {...register('metadata.notes')}
            rows={3}
            placeholder="Any special requests or notes..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Price Summary */}
        <div className="bg-gray-50 p-4 rounded-md">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-600">Price per item:</span>
            <span className="font-semibold">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: productCurrency,
              }).format(productPrice)}
            </span>
          </div>
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total:</span>
            <span className="text-blue-600">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: productCurrency,
              }).format(productPrice)}
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={createBookingMutation.isPending}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-md font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {createBookingMutation.isPending ? 'Creating Booking...' : 'Continue to Payment'}
        </button>

        {createBookingMutation.isError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {(createBookingMutation.error as any)?.response?.data?.message ||
              'An error occurred while creating the booking'}
          </div>
        )}
      </form>
    </div>
  );
};
