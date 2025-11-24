import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMyOrders, fetchOrderDetail } from '../services/api';

interface Order {
  id: string;
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
  }>;
  total_amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  created_at: string;
  paid_at?: string;
}

export const OrderTracker: React.FC = () => {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['myOrders'],
    queryFn: fetchMyOrders,
  });

  const [selectedOrderId, setSelectedOrderId] = React.useState<string | null>(null);

  const { data: orderDetail } = useQuery({
    queryKey: ['orderDetail', selectedOrderId],
    queryFn: () => fetchOrderDetail(selectedOrderId!),
    enabled: !!selectedOrderId,
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      paid: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading your orders...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>

      {orders?.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded">
          <p className="text-gray-500">You haven't placed any orders yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders?.map((order: Order) => (
            <div key={order.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg">Order #{order.id.substring(0, 8)}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded text-sm ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                  <br />
                  <span className={`px-3 py-1 rounded text-sm mt-2 inline-block ${getStatusColor(order.payment_status)}`}>
                    Payment: {order.payment_status}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="mb-3">
                <p className="font-semibold mb-2">Items:</p>
                <ul className="space-y-1">
                  {order.items.map((item, idx) => (
                    <li key={idx} className="text-sm">
                      {item.product_name} × {item.quantity} - ${item.price * item.quantity}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Total */}
              <div className="border-t pt-3 flex justify-between items-center">
                <p className="font-bold text-lg">
                  Total: ${order.total_amount} {order.currency}
                </p>
                <button
                  onClick={() => setSelectedOrderId(order.id)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  View Details
                </button>
              </div>

              {/* Payment Status */}
              {order.payment_status === 'paid' && order.paid_at && (
                <div className="mt-2 text-sm text-green-600">
                  ✓ Paid on {new Date(order.paid_at).toLocaleString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrderId && orderDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Order Details</h2>
            
            {/* Status History */}
            {orderDetail.tracking_info?.status_history && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Status History:</h3>
                <div className="space-y-2">
                  {orderDetail.tracking_info.status_history.map((entry: any, idx: number) => (
                    <div key={idx} className="text-sm border-l-2 border-blue-500 pl-3">
                      <p className="font-semibold">{entry.status}</p>
                      <p className="text-gray-500">{new Date(entry.timestamp).toLocaleString()}</p>
                      {entry.note && <p className="text-gray-600">{entry.note}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setSelectedOrderId(null)}
              className="mt-4 bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
