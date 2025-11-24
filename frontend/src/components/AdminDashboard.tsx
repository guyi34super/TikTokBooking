import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAllOrders, markOrderAsPaid, setAdminMode } from '../services/api';

interface Order {
  id: string;
  user_id: string;
  items: any[];
  total_amount: string;
  currency: string;
  status: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  paid_at?: string;
  created_at: string;
}

interface AdminDashboardProps {
  isAdmin: boolean;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ isAdmin }) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  // Update admin mode in API
  useEffect(() => {
    setAdminMode(isAdmin);
  }, [isAdmin]);

  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['allOrders', statusFilter, paymentFilter, isAdmin],
    queryFn: () =>
      fetchAllOrders(
        statusFilter !== 'all' ? statusFilter : undefined,
        paymentFilter !== 'all' ? paymentFilter : undefined
      ),
    enabled: isAdmin,
  });

  const markPaidMutation = useMutation({
    mutationFn: markOrderAsPaid,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allOrders'] });
      alert('✅ Order marked as paid successfully!');
    },
    onError: (error: any) => {
      alert('❌ Failed to mark order as paid: ' + (error.response?.data?.error || error.message));
    },
  });

  const getStatusBadge = (status: string) => {
    const classes: Record<string, string> = {
      pending: 'badge-pending',
      paid: 'badge-paid',
      failed: 'badge-failed',
      processing: 'badge-processing',
      completed: 'badge-completed',
    };
    return classes[status] || 'badge';
  };

  // Calculate stats
  const stats = useMemo(() => {
    if (!orders) return { total: 0, pending: 0, paid: 0, revenue: 0 };
    
    return {
      total: orders.length,
      pending: orders.filter((o: Order) => o.payment_status === 'pending').length,
      paid: orders.filter((o: Order) => o.payment_status === 'paid').length,
      revenue: orders
        .filter((o: Order) => o.payment_status === 'paid')
        .reduce((sum: number, o: Order) => sum + parseFloat(o.total_amount), 0),
    };
  }, [orders]);

  if (!isAdmin) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ fontSize: '3rem', margin: '0 0 1rem 0' }}>🔒</p>
          <h2>Admin Access Required</h2>
          <p style={{ color: '#666' }}>
            Please toggle "Admin Mode" in the navigation to access this dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) return <div className="loading">Loading orders...</div>;
  
  if (error) {
    return (
      <div className="container">
        <div className="error">
          Failed to load orders. Make sure the backend is running.
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 style={{ marginBottom: '2rem' }}>👨‍💼 Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-4" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Total Orders</p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', fontWeight: 'bold' }}>{stats.total}</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Pending Payment</p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', fontWeight: 'bold', color: '#f57c00' }}>
            {stats.pending}
          </p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Paid Orders</p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', fontWeight: 'bold', color: '#4caf50' }}>
            {stats.paid}
          </p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Total Revenue</p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', fontWeight: 'bold', color: '#667eea' }}>
            ${stats.revenue.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>
              Order Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd', minWidth: '150px' }}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>
              Payment Status
            </label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #ddd', minWidth: '150px' }}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e0e0e0', textAlign: 'left' }}>
              <th style={{ padding: '1rem' }}>Order ID</th>
              <th style={{ padding: '1rem' }}>Customer</th>
              <th style={{ padding: '1rem' }}>Amount</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem' }}>Payment</th>
              <th style={{ padding: '1rem' }}>Date</th>
              <th style={{ padding: '1rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders?.map((order: Order) => (
              <tr key={order.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '1rem', fontFamily: 'monospace' }}>
                  {order.id.substring(0, 8)}
                </td>
                <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  {order.user_id.substring(0, 8)}
                </td>
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>
                  ${parseFloat(order.total_amount).toFixed(2)}
                </td>
                <td style={{ padding: '1rem' }}>
                  <span className={`badge ${getStatusBadge(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span className={`badge ${getStatusBadge(order.payment_status)}`}>
                    {order.payment_status}
                  </span>
                </td>
                <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                  {new Date(order.created_at).toLocaleDateString()}
                </td>
                <td style={{ padding: '1rem' }}>
                  {order.payment_status === 'pending' ? (
                    <button
                      onClick={() => markPaidMutation.mutate(order.id)}
                      className="btn btn-success"
                      disabled={markPaidMutation.isPending}
                      style={{ fontSize: '0.85rem' }}
                    >
                      Mark Paid
                    </button>
                  ) : order.payment_status === 'paid' && order.paid_at ? (
                    <span style={{ fontSize: '0.85rem', color: '#4caf50' }}>
                      ✓ {new Date(order.paid_at).toLocaleDateString()}
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.85rem', color: '#999' }}>-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {orders?.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            No orders found with the selected filters
          </div>
        )}
      </div>
    </div>
  );
};
