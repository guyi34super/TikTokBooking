import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAdminOrders, markOrderPaid } from '../services/api'

function AdminDashboard() {
  const queryClient = useQueryClient()

  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: getAdminOrders,
    refetchInterval: 5000
  })

  const markPaidMutation = useMutation({
    mutationFn: markOrderPaid,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-orders'])
      alert('Order marked as paid successfully')
    },
    onError: (error) => {
      alert(error.response?.data?.error || 'Failed to mark order as paid')
    }
  })

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert alert-error">
        Failed to load admin dashboard: {error.message}
      </div>
    )
  }

  const stats = {
    total: orders?.length || 0,
    paid: orders?.filter(o => o.payment_status === 'paid').length || 0,
    pending: orders?.filter(o => o.payment_status === 'pending').length || 0,
    revenue: orders?.reduce((sum, o) => sum + parseFloat(o.total_amount), 0) || 0
  }

  return (
    <div>
      <div className="page-header">
        <h2>Admin Dashboard</h2>
        <p>Manage orders and monitor platform activity</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Orders</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Paid Orders</div>
          <div className="stat-value" style={{ color: '#48bb78' }}>{stats.paid}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending Payment</div>
          <div className="stat-value" style={{ color: '#ed8936' }}>{stats.pending}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value" style={{ color: '#667eea' }}>
            ${stats.revenue.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">All Orders</h3>
        </div>

        {orders?.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Client</th>
                  <th>Seller</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                    <td>
                      <div>{order.client_name || 'N/A'}</div>
                      <div style={{ fontSize: '12px', color: '#718096' }}>
                        {order.client_email}
                      </div>
                    </td>
                    <td>
                      <div>{order.seller_name || 'N/A'}</div>
                      <div style={{ fontSize: '12px', color: '#718096' }}>
                        {order.seller_email}
                      </div>
                    </td>
                    <td style={{ fontWeight: '600' }}>
                      ${parseFloat(order.total_amount).toFixed(2)}
                    </td>
                    <td>
                      <span className={`badge ${
                        order.payment_status === 'paid' ? 'badge-success' : 'badge-warning'
                      }`}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td>
                      {order.payment_status !== 'paid' && (
                        <button
                          className="btn btn-primary"
                          onClick={() => markPaidMutation.mutate(order.id)}
                          disabled={markPaidMutation.isPending}
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          Mark as Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <h3>No Orders Yet</h3>
            <p>Orders will appear here once customers start making purchases</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard
