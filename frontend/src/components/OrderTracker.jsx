import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { getBookings } from '../services/api'

function OrderTracker() {
  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['bookings'],
    queryFn: getBookings,
    refetchInterval: 5000 // Refresh every 5 seconds
  })

  if (isLoading) return <div className="loading">Loading orders...</div>
  if (error) return <div className="error">Error loading orders: {error.message}</div>

  return (
    <div>
      <h2 style={{ color: 'white', marginBottom: '1rem' }}>📦 My Orders</h2>
      
      <div className="order-list">
        {orders?.length === 0 ? (
          <div className="card">
            <p>No orders yet. Start shopping!</p>
          </div>
        ) : (
          orders?.map(order => (
            <div key={order.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <h3>Order #{order.id}</h3>
                  <p style={{ color: '#6b7280' }}>
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    background: order.payment_status === 'paid' ? '#10b981' : '#f59e0b',
                    color: 'white',
                    fontSize: '0.875rem'
                  }}>
                    {order.payment_status === 'paid' ? '✅ PAID' : '⏳ PENDING'}
                  </span>
                </div>
              </div>
              
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
                <strong>Items:</strong>
                <div style={{ marginTop: '0.5rem' }}>
                  {JSON.parse(order.items || '[]').map((item, idx) => (
                    <div key={idx} style={{ padding: '0.25rem 0' }}>
                      {item.product_name} x{item.quantity} - ${parseFloat(item.price).toFixed(2)}
                    </div>
                  ))}
                </div>
              </div>
              
              <div style={{ 
                marginTop: '1rem', 
                paddingTop: '1rem', 
                borderTop: '1px solid #e5e7eb',
                textAlign: 'right'
              }}>
                <strong style={{ fontSize: '1.25rem', color: '#667eea' }}>
                  Total: ${parseFloat(order.total_amount).toFixed(2)}
                </strong>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default OrderTracker
