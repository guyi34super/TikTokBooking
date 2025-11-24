import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProducts, createBooking } from '../services/api'

function ProductList({ userType }) {
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
      alert('Order created successfully!')
      queryClient.invalidateQueries(['orders'])
    },
    onError: (error) => {
      alert(error.response?.data?.error || 'Failed to create order')
    }
  })

  const addToCart = (product) => {
    const existing = cart.find(item => item.product_id === product.id)
    if (existing) {
      setCart(cart.map(item => 
        item.product_id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, { 
        product_id: product.id, 
        quantity: 1, 
        price: product.price,
        name: product.name
      }])
    }
  }

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId))
  }

  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) {
      removeFromCart(productId)
    } else {
      setCart(cart.map(item => 
        item.product_id === productId 
          ? { ...item, quantity }
          : item
      ))
    }
  }

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Cart is empty!')
      return
    }
    createBookingMutation.mutate({ items: cart })
  }

  const cartTotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0)

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading products...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert alert-error">
        Failed to load products: {error.message}
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h2>Products & Services</h2>
        <p>Browse and purchase available products and services</p>
      </div>

      {cart.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Shopping Cart ({cart.length} items)</h3>
          </div>
          
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => (
                  <tr key={item.product_id}>
                    <td>{item.name}</td>
                    <td>${parseFloat(item.price).toFixed(2)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button 
                          className="btn btn-secondary"
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          style={{ padding: '4px 12px' }}
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button 
                          className="btn btn-secondary"
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          style={{ padding: '4px 12px' }}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td>${(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
                    <td>
                      <button 
                        onClick={() => removeFromCart(item.product_id)}
                        className="btn btn-danger"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '18px', fontWeight: '600' }}>
              Total: ${cartTotal.toFixed(2)}
            </div>
            <button 
              className="btn btn-primary"
              onClick={handleCheckout}
              disabled={createBookingMutation.isPending}
            >
              {createBookingMutation.isPending ? 'Processing...' : 'Checkout'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-3">
        {products?.map(product => (
          <div key={product.id} className="product-card">
            <div className="product-header">
              <div className="product-name">{product.name}</div>
              <div className="product-type">{product.type}</div>
            </div>

            {product.seller_name && (
              <div style={{ fontSize: '12px', color: '#718096', marginBottom: '8px' }}>
                Seller: {product.business_name || product.seller_name}
                {product.rating && ` (${product.rating} stars)`}
              </div>
            )}

            <div className="product-price">
              ${parseFloat(product.price).toFixed(2)}
            </div>

            <div className="product-footer">
              <span className={`badge ${product.in_stock ? 'badge-success' : 'badge-danger'}`}>
                {product.in_stock ? 'In Stock' : 'Out of Stock'}
              </span>
              <button 
                className="btn btn-primary"
                onClick={() => addToCart(product)}
                disabled={!product.in_stock}
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>

      {products?.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <h3>No Products Available</h3>
          <p>Check back later for new products and services</p>
        </div>
      )}
    </div>
  )
}

export default ProductList
