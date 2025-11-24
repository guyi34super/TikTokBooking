import React, { useState } from 'react';
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
  total_amount: string;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  created_at: string;
  paid_at?: string;
}

export const OrderTracker: React.FC = () => {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['myOrders'],
    queryFn: fetchMyOrders,
  });

  const { data: orderDetail } = useQuery({
    queryKey: ['orderDetail', selectedOrderId],
    queryFn: () => fetchOrderDetail(selectedOrderId!),
    enabled: !!selectedOrderId,
  });

  const getStatusBadge = (status: string) => {
    const classes: Record<string, string> = {
      pending: 'badge-pending',
      processing: 'badge-processing',
      completed: 'badge-completed',
      paid: 'badge-paid',
      failed: 'badge-failed',
    };
    return classes[status] || '';
  };

  if (isLoading) {
    return <div className="loading">Loading your orders...</div>;
  }

  return (
    <div className="container">
      <h1 style={{ marginBottom: '2rem' }}>My Orders</h1>

      {!orders || orders.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ fontSize: '3rem', margin: '0 0 1rem 0' }}>📦</p>
          <p style={{ color: '#666', fontSize: '1.1rem' }}>You haven't placed any orders yet</p>
          <p style={{ color: '#999', marginTop: '0.5rem' }}>
            Go to Products tab to start shopping!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.map((order: Order) => (
            <div key={order.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0' }}>
                    Order #{order.id.substring(0, 8)}
                  </h3>
                  <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                    📅 {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${getStatusBadge(order.status)}`}>
                    {order.status.toUpperCase()}
                  </span>
                  <br />
                  <span className={`badge ${getStatusBadge(order.payment_status)}`} style={{ marginTop: '0.5rem' }}>
                    💳 {order.payment_status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f9f9f9', borderRadius: '8px' }}>
                <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Items:</strong>
                <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                  {order.items.map((item, idx) => (
                    <li key={idx} style={{ marginBottom: '0.25rem' }}>
                      {item.product_name} × {item.quantity} - ${(item.price * item.quantity).toFixed(2)}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Total */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '2px solid #e0e0e0' }}>
                <strong style={{ fontSize: '1.2rem' }}>
                  Total: ${parseFloat(order.total_amount).toFixed(2)}
                </strong>
                <button
                  onClick={() => setSelectedOrderId(order.id)}
                  className="btn btn-primary"
                >
                  View Details
                </button>
              </div>

              {/* Payment Status */}
              {order.payment_status === 'paid' && order.paid_at && (
                <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#d4edda', borderRadius: '4px', color: '#155724', fontSize: '0.9rem' }}>
                  ✓ Paid on {new Date(order.paid_at).toLocaleString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrderId && orderDetail && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginTop: 0 }}>Order Details</h2>
            
            <div style={{ marginBottom: '1rem' }}>
              <strong>Order ID:</strong> {orderDetail.id}
            </div>

            {/* Status History */}
            {orderDetail.tracking_info?.status_history && orderDetail.tracking_info.status_history.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Status History:</strong>
                <div style={{ borderLeft: '3px solid #667eea', paddingLeft: '1rem' }}>
                  {orderDetail.tracking_info.status_history.map((entry: any, idx: number) => (
                    <div key={idx} style={{ marginBottom: '1rem' }}>
                      <div style={{ fontWeight: 'bold', color: '#667eea' }}>{entry.status}</div>
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>
                        {new Date(entry.timestamp).toLocaleString()}
                      </div>
                      {entry.note && (
                        <div style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>{entry.note}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setSelectedOrderId(null)}
              className="btn"
              style={{ background: '#e0e0e0', width: '100%' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
