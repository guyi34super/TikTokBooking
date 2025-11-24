import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchBookings, cancelBooking } from '../../services/api';
import { format } from 'date-fns';

interface Booking {
  id: string;
  product_id: string;
  start_time: string;
  end_time?: string;
  quantity: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'FAILED';
  price_amount: number;
  price_currency: string;
  created_at: string;
}

interface BookingListProps {
  userId?: string;
  status?: string;
}

export const BookingList: React.FC<BookingListProps> = ({ userId, status }) => {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const {
    data: bookingsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['bookings', { userId, status, page, pageSize }],
    queryFn: () => fetchBookings({ userId, status, page, pageSize }),
  });

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      await cancelBooking(bookingId);
      refetch();
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      alert('Failed to cancel booking');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      COMPLETED: 'bg-blue-100 text-blue-800',
      FAILED: 'bg-gray-100 text-gray-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
        Failed to load bookings. Please try again.
      </div>
    );
  }

  const bookings = bookingsData?.items || [];
  const pagination = bookingsData?.pagination;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-6">My Bookings</h2>

      {bookings.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg">No bookings found</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {bookings.map((booking: Booking) => (
              <div
                key={booking.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">
                      Booking #{booking.id.substring(0, 8)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Created: {format(new Date(booking.created_at), 'PPP')}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      booking.status
                    )}`}
                  >
                    {booking.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Start Time</p>
                    <p className="font-medium">
                      {format(new Date(booking.start_time), 'PPP p')}
                    </p>
                  </div>
                  {booking.end_time && (
                    <div>
                      <p className="text-sm text-gray-600">End Time</p>
                      <p className="font-medium">
                        {format(new Date(booking.end_time), 'PPP p')}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Quantity</p>
                    <p className="font-medium">{booking.quantity}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="font-medium text-lg">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: booking.price_currency,
                      }).format(booking.price_amount)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <button
                    onClick={() => window.open(`/bookings/${booking.id}`, '_blank')}
                    className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    View Details
                  </button>
                  {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                    >
                      Cancel Booking
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {page} of {pagination.total_pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
                disabled={page === pagination.total_pages}
                className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
