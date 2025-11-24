import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { getOrders } from '../services/api'

function OrderList({ userType }) {
  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['orders'],
    queryFn: getOrders,
    refetchInterval: 10000 // Refresh every 10 seconds
  })

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading {userType === 'seller' ? 'sales' : 'orders'}...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert alert-error">
        Failed to load {userType === 'seller' ? 'sales' : 'orders'}: {error.message}
      </div>
    )
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      confirmed: 'badge-info',
      paid: 'badge-success',
      cancelled: 'badge-danger'
    }
    return badges[status] || 'badge-info'
  }

  return (
    <div>
      <div className="page-header">
        <h2>{userType === 'seller' ? 'Sales History' : 'Order History'}</h2>
        <p>View your {userType === 'seller' ? 'sales' : 'orders'} and payment status</p>
      </div>

      {orders?.length > 0 ? (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                    <td>
                      {JSON.parse(order.items || '[]').map((item, idx) => (
                        <div key={idx} style={{ fontSize: '12px' }}>
                          {item.product_name} x{item.quantity}
                        </div>
                      ))}
                    </td>
                    <td style={{ fontWeight: '600' }}>
                      ${parseFloat(order.total_amount).toFixed(2)}
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(order.payment_status)}`}>
                        {order.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No {userType === 'seller' ? 'Sales' : 'Orders'} Yet</h3>
          <p>
            {userType === 'seller' 
              ? 'Sales will appear here once customers purchase your products' 
              : 'Your orders will appear here once you make a purchase'}
          </p>
        </div>
      )}
    </div>
  )
}

export default OrderList
