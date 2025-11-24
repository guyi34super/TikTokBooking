import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tantml:invoke>
<parameter name="fetchProducts, createOrder } from '../services/api';

interface Product {
  id: string;
  name: string;
  description: string;
  type: 'product' | 'service';
  price: string;
  currency: string;
  category: string;
  image_url: string;
  in_stock: boolean;
}

export const ProductList: React.FC = () => {
  const [selectedType, setSelectedType] = useState<'all' | 'product' | 'service'>('all');
  const [cart, setCart] = useState<Map<string, { product: Product; quantity: number }>>(new Map());
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', selectedType],
    queryFn: () => fetchProducts(selectedType !== 'all' ? selectedType : undefined),
  });

  const createOrderMutation = useMutation({
    mutationFn: (items: Array<{ product_id: string; quantity: number }>) => createOrder(items),
    onSuccess: () => {
      setCart(new Map());
      alert('✅ Order created successfully! Check "My Orders" tab.');
      queryClient.invalidateQueries({ queryKey: ['myOrders'] });
    },
    onError: (error: any) => {
      alert('❌ Failed to create order: ' + (error.response?.data?.error || error.message));
    },
  });

  const addToCart = (product: Product) => {
    setCart(prev => {
      const newCart = new Map(prev);
      const existing = newCart.get(product.id);
      if (existing) {
        newCart.set(product.id, { product, quantity: existing.quantity + 1 });
      } else {
        newCart.set(product.id, { product, quantity: 1 });
      }
      return newCart;
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const newCart = new Map(prev);
      const existing = newCart.get(productId);
      if (existing && existing.quantity > 1) {
        newCart.set(productId, { ...existing, quantity: existing.quantity - 1 });
      } else {
        newCart.delete(productId);
      }
      return newCart;
    });
  };

  const cartTotal = () => {
    let total = 0;
    cart.forEach(({ product, quantity }) => {
      total += parseFloat(product.price) * quantity;
    });
    return total;
  };

  const handleCheckout = () => {
    const items = Array.from(cart.values()).map(({ product, quantity }) => ({
      product_id: product.id,
      quantity,
    }));
    createOrderMutation.mutate(items);
  };

  if (isLoading) {
    return <div className="loading">Loading products...</div>;
  }

  return (
    <div className="container">
      <h1 style={{ marginBottom: '2rem' }}>Products & Services</h1>

      {/* Filter */}
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() => setSelectedType('all')}
          className={selectedType === 'all' ? 'btn btn-primary' : 'btn'}
          style={selectedType !== 'all' ? { background: '#e0e0e0', color: '#333' } : {}}
        >
          All
        </button>
        <button
          onClick={() => setSelectedType('product')}
          className={selectedType === 'product' ? 'btn btn-primary' : 'btn'}
          style={selectedType !== 'product' ? { background: '#e0e0e0', color: '#333' } : {}}
        >
          Products
        </button>
        <button
          onClick={() => setSelectedType('service')}
          className={selectedType === 'service' ? 'btn btn-primary' : 'btn'}
          style={selectedType !== 'service' ? { background: '#e0e0e0', color: '#333' } : {}}
        >
          Services
        </button>
      </div>

      {/* Cart Summary */}
      {cart.size > 0 && (
        <div className="card" style={{ marginBottom: '2rem', background: '#e8f5e9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>🛒 Cart: {cart.size} items | Total: ${cartTotal().toFixed(2)}</strong>
            </div>
            <button
              onClick={handleCheckout}
              className="btn btn-success"
              disabled={createOrderMutation.isPending}
            >
              {createOrderMutation.isPending ? '⏳ Creating...' : '✓ Place Order'}
            </button>
          </div>
        </div>
      )}

      {/* Product Grid */}
      <div className="grid grid-cols-3" style={{ gap: '1.5rem' }}>
        {products?.map((product: Product) => (
          <div key={product.id} className="card">
            <div style={{
              width: '100%',
              height: '200px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3rem',
              marginBottom: '1rem'
            }}>
              {product.type === 'service' ? '🛠️' : '📦'}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{product.name}</h3>
              <span className="badge" style={{ background: '#e3f2fd', color: '#1976d2', fontSize: '0.75rem' }}>
                {product.type}
              </span>
            </div>
            
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem', minHeight: '3rem' }}>
              {product.description}
            </p>
            
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#667eea', marginBottom: '1rem' }}>
              ${parseFloat(product.price).toFixed(2)}
            </p>
            
            {product.in_stock ? (
              <div>
                {cart.has(product.id) ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                    <button
                      onClick={() => removeFromCart(product.id)}
                      className="btn"
                      style={{ background: '#f5f5f5', width: '40px' }}
                    >
                      −
                    </button>
                    <span style={{ fontWeight: 'bold', minWidth: '30px', textAlign: 'center' }}>
                      {cart.get(product.id)?.quantity}
                    </span>
                    <button
                      onClick={() => addToCart(product)}
                      className="btn"
                      style={{ background: '#f5f5f5', width: '40px' }}
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => addToCart(product)}
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                  >
                    Add to Cart
                  </button>
                )}
              </div>
            ) : (
              <button disabled className="btn" style={{ width: '100%', background: '#e0e0e0', cursor: 'not-allowed' }}>
                Out of Stock
              </button>
            )}
          </div>
        ))}
      </div>

      {products?.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
          No products found
        </div>
      )}
    </div>
  );
};
