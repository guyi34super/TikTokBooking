import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAdminOrders, markOrderPaid } from '../services/api'

function AdminDashboard({ isAdmin }) {
  const queryClient = useQueryClient()

  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: getAdminOrders,
    enabled: isAdmin,
    refetchInterval: 3000
  })

  const markPaidMutation = useMutation({
    mutationFn: markOrderPaid,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-orders'])
      alert('✅ Order marked as paid!')
    }
  })

  if (!isAdmin) {
    return (
      <div className="card">
        <h2>🔒 Admin Access Required</h2>
        <p>Please enable admin mode to access the dashboard.</p>
      </div>
    )
  }

  if (isLoading) return <div className="loading">Loading admin dashboard...</div>
  if (error) return <div className="error">Error loading orders: {error.message}</div>

  const stats = {
    total: orders?.length || 0,
    paid: orders?.filter(o => o.payment_status === 'paid').length || 0,
    pending: orders?.filter(o => o.payment_status === 'pending').length || 0,
    revenue: orders?.reduce((sum, o) => sum + parseFloat(o.total_amount), 0) || 0
  }

  return (
    <div>
      <h2 style={{ color: 'white', marginBottom: '1rem' }}>👨‍💼 Admin Dashboard</h2>
      
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ background: '#667eea', color: 'white' }}>
          <h3>{stats.total}</h3>
          <p>Total Orders</p>
        </div>
        <div className="card" style={{ background: '#10b981', color: 'white' }}>
          <h3>{stats.paid}</h3>
          <p>Paid Orders</p>
        </div>
        <div className="card" style={{ background: '#f59e0b', color: 'white' }}>
          <h3>{stats.pending}</h3>
          <p>Pending Payment</p>
        </div>
        <div className="card" style={{ background: '#8b5cf6', color: 'white' }}>
          <h3>${stats.revenue.toFixed(2)}</h3>
          <p>Total Revenue</p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card">
        <h3>All Orders</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>ID</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Date</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Amount</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders?.map(order => (
                <tr key={order.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '0.75rem' }}>#{order.id}</td>
                  <td style={{ padding: '0.75rem' }}>
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    ${parseFloat(order.total_amount).toFixed(2)}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      background: order.payment_status === 'paid' ? '#10b981' : '#f59e0b',
                      color: 'white',
                      fontSize: '0.75rem'
                    }}>
                      {order.payment_status}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    {order.payment_status !== 'paid' && (
                      <button
                        className="btn btn-success"
                        onClick={() => markPaidMutation.mutate(order.id)}
                        disabled={markPaidMutation.isPending}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
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
      </div>
    </div>
  )
}

export default AdminDashboard
