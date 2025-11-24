import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProductList } from './components/ProductList';
import { OrderTracker } from './components/OrderTracker';
import { AdminDashboard } from './components/AdminDashboard';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const [view, setView] = useState<'products' | 'orders' | 'admin'>('products');
  const [isAdmin, setIsAdmin] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="App">
        {/* Navigation */}
        <nav style={{ 
          padding: '1rem 2rem', 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: '2rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ margin: 0, flex: 1, fontSize: '1.5rem' }}>🛒 Order Tracking System</h1>
          
          <button 
            onClick={() => setView('products')}
            style={{ 
              padding: '0.5rem 1.5rem',
              background: view === 'products' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
              color: 'white',
              border: '2px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.3s'
            }}
          >
            📦 Products
          </button>
          
          <button 
            onClick={() => setView('orders')}
            style={{ 
              padding: '0.5rem 1.5rem',
              background: view === 'orders' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
              color: 'white',
              border: '2px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.3s'
            }}
          >
            📋 My Orders
          </button>
          
          <button 
            onClick={() => {
              setView('admin');
              setIsAdmin(!isAdmin);
            }}
            style={{ 
              padding: '0.5rem 1.5rem',
              background: view === 'admin' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
              color: 'white',
              border: '2px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.3s'
            }}
          >
            👨‍💼 Admin
          </button>

          <div style={{
            fontSize: '0.8rem',
            padding: '0.25rem 0.75rem',
            background: isAdmin ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.3)'
          }}>
            {isAdmin ? '🔓 Admin Mode' : '👤 User Mode'}
          </button>
        </nav>

        {/* Content */}
        <div style={{ minHeight: 'calc(100vh - 80px)' }}>
          {view === 'products' && <ProductList />}
          {view === 'orders' && <OrderTracker />}
          {view === 'admin' && <AdminDashboard isAdmin={isAdmin} />}
        </div>

        {/* Footer */}
        <footer style={{
          padding: '1rem',
          textAlign: 'center',
          background: '#f5f5f5',
          borderTop: '1px solid #ddd',
          color: '#666'
        }}>
          <p style={{ margin: 0 }}>Order Tracking System | Track your orders and check payment status</p>
        </footer>
      </div>
    </QueryClientProvider>
  );
}

export default App;
