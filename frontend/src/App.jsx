import React, { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import ProductList from './components/ProductList'
import OrderTracker from './components/OrderTracker'
import AdminDashboard from './components/AdminDashboard'
import './App.css'

const stripePromise = loadStripe('pk_test_YOUR_STRIPE_PUBLISHABLE_KEY')

function App() {
  const [view, setView] = useState('products')
  const [isAdmin, setIsAdmin] = useState(false)

  return (
    <Elements stripe={stripePromise}>
      <div className="app">
        <nav className="navbar">
          <h1>🛍️ Booking Platform</h1>
          <div className="nav-buttons">
            <button 
              onClick={() => setView('products')}
              className={view === 'products' ? 'active' : ''}
            >
              🛒 Products
            </button>
            <button 
              onClick={() => setView('orders')}
              className={view === 'orders' ? 'active' : ''}
            >
              📦 My Orders
            </button>
            <button 
              onClick={() => { setView('admin'); setIsAdmin(!isAdmin); }}
              className={view === 'admin' ? 'active' : ''}
            >
              👨‍💼 Admin
            </button>
          </div>
        </nav>

        <main className="main-content">
          {view === 'products' && <ProductList />}
          {view === 'orders' && <OrderTracker />}
          {view === 'admin' && <AdminDashboard isAdmin={isAdmin} />}
        </main>

        <footer className="footer">
          <p>✅ Microservices Platform | Connected to API Gateway (http://localhost:8080)</p>
          <p>📊 TikTok Pixel Active</p>
        </footer>
      </div>
    </Elements>
  )
}

export default App
