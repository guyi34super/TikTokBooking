import React, { useState } from 'react'
import ProductList from './ProductList'
import OrderList from './OrderList'
import AdminDashboard from './AdminDashboard'

function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('products')

  const tabs = [
    { id: 'products', label: 'Products', roles: ['client', 'seller', 'admin'] },
    { id: 'orders', label: user.user_type === 'seller' ? 'Sales' : 'Orders', roles: ['client', 'seller', 'admin'] },
    { id: 'admin', label: 'Admin', roles: ['admin'] }
  ]

  const visibleTabs = tabs.filter(tab => tab.roles.includes(user.user_type))

  return (
    <div className="dashboard">
      <header className="header">
        <div className="header-content">
          <div className="header-logo">
            <h1>Booking Platform</h1>
          </div>
          <div className="header-user">
            <div className="user-info">
              <div className="user-name">{user.name}</div>
              <div className="user-type">{user.user_type}</div>
            </div>
            <button onClick={onLogout} className="btn btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </header>

      <nav className="nav-tabs">
        <div className="nav-tabs-content">
          {visibleTabs.map(tab => (
            <button
              key={tab.id}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="main-content">
        {activeTab === 'products' && <ProductList userType={user.user_type} />}
        {activeTab === 'orders' && <OrderList userType={user.user_type} />}
        {activeTab === 'admin' && <AdminDashboard />}
      </main>
    </div>
  )
}

export default Dashboard
