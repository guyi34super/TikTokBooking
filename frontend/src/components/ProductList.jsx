import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProducts, createBooking } from '../services/api'

function ProductList() {
  const [cart, setCart] = useState([])
  const queryClient = useQueryClient()

  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts
  })

  const createBookingMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      setCart([])
      alert('✅ Booking created successfully!')
      queryClient.invalidateQueries(['bookings'])
    }
  })

  const addToCart = (product) => {
    setCart([...cart, { product_id: product.id, quantity: 1, price: product.price }])
  }

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index))
  }

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Cart is empty!')
      return
    }
    createBookingMutation.mutate({ items: cart })
  }

  if (isLoading) return <div className="loading">Loading products...</div>
  if (error) return <div className="error">Error loading products: {error.message}</div>

  return (
    <div>
      <h2 style={{ color: 'white', marginBottom: '1rem' }}>🛒 Available Products & Services</h2>
      
      <div className="product-grid">
        {products?.map(product => (
          <div key={product.id} className="card">
            <h3>{product.name}</h3>
            <p style={{ color: '#6b7280', margin: '0.5rem 0' }}>
              Type: {product.type}
            </p>
            <p style={{ fontSize: '1.5rem', color: '#667eea', fontWeight: 'bold' }}>
              ${parseFloat(product.price).toFixed(2)}
            </p>
            <p style={{ color: product.in_stock ? '#10b981' : '#ef4444' }}>
              {product.in_stock ? '✅ In Stock' : '❌ Out of Stock'}
            </p>
            <button 
              className="btn btn-primary"
              onClick={() => addToCart(product)}
              disabled={!product.in_stock}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>

      {cart.length > 0 && (
        <div className="card" style={{ marginTop: '2rem' }}>
          <h3>🛒 Cart ({cart.length} items)</h3>
          {cart.map((item, index) => (
            <div key={index} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              padding: '0.5rem 0',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <span>Product {item.product_id} x{item.quantity}</span>
              <div>
                <span style={{ marginRight: '1rem' }}>${parseFloat(item.price).toFixed(2)}</span>
                <button onClick={() => removeFromCart(index)}>❌</button>
              </div>
            </div>
          ))}
          <div style={{ marginTop: '1rem', textAlign: 'right' }}>
            <strong>Total: ${cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0).toFixed(2)}</strong>
          </div>
          <button 
            className="btn btn-success"
            onClick={handleCheckout}
            disabled={createBookingMutation.isPending}
            style={{ width: '100%', marginTop: '1rem' }}
          >
            {createBookingMutation.isPending ? 'Processing...' : '🚀 Checkout'}
          </button>
        </div>
      )}
    </div>
  )
}

export default ProductList
