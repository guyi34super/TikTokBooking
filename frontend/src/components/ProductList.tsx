import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchProducts } from '../services/api';

interface Product {
  id: string;
  name: string;
  description: string;
  type: 'product' | 'service';
  price: number;
  currency: string;
  category: string;
  image_url: string;
  in_stock: boolean;
}

export const ProductList: React.FC = () => {
  const [selectedType, setSelectedType] = useState<'all' | 'product' | 'service'>('all');
  const [cart, setCart] = useState<Map<string, number>>(new Map());

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', selectedType],
    queryFn: () => fetchProducts(selectedType !== 'all' ? selectedType : undefined),
  });

  const addToCart = (productId: string) => {
    setCart(prev => {
      const newCart = new Map(prev);
      newCart.set(productId, (newCart.get(productId) || 0) + 1);
      return newCart;
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const newCart = new Map(prev);
      const current = newCart.get(productId) || 0;
      if (current > 1) {
        newCart.set(productId, current - 1);
      } else {
        newCart.delete(productId);
      }
      return newCart;
    });
  };

  const cartTotal = () => {
    let total = 0;
    cart.forEach((quantity, productId) => {
      const product = products?.find((p: Product) => p.id === productId);
      if (product) total += product.price * quantity;
    });
    return total;
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading products...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Products & Services</h1>

      {/* Filter */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setSelectedType('all')}
          className={`px-4 py-2 rounded ${
            selectedType === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setSelectedType('product')}
          className={`px-4 py-2 rounded ${
            selectedType === 'product' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          Products
        </button>
        <button
          onClick={() => setSelectedType('service')}
          className={`px-4 py-2 rounded ${
            selectedType === 'service' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          Services
        </button>
      </div>

      {/* Cart Summary */}
      {cart.size > 0 && (
        <div className="mb-6 bg-green-50 border border-green-200 p-4 rounded">
          <p className="font-semibold">Cart: {cart.size} items | Total: ${cartTotal().toFixed(2)}</p>
          <button
            onClick={() => window.location.href = '/checkout'}
            className="mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Proceed to Checkout
          </button>
        </div>
      )}

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products?.map((product: Product) => (
          <div key={product.id} className="border rounded-lg overflow-hidden shadow hover:shadow-lg">
            <img
              src={product.image_url || '/placeholder.jpg'}
              alt={product.name}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg">{product.name}</h3>
                <span className="text-xs bg-blue-100 px-2 py-1 rounded">{product.type}</span>
              </div>
              <p className="text-gray-600 text-sm mb-3">{product.description}</p>
              <p className="text-xl font-bold text-blue-600 mb-3">
                ${product.price} {product.currency}
              </p>
              
              {product.in_stock ? (
                <div className="flex items-center gap-2">
                  {cart.has(product.id) ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => removeFromCart(product.id)}
                        className="bg-gray-300 px-3 py-1 rounded"
                      >
                        -
                      </button>
                      <span className="font-semibold">{cart.get(product.id)}</span>
                      <button
                        onClick={() => addToCart(product.id)}
                        className="bg-gray-300 px-3 py-1 rounded"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(product.id)}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Add to Cart
                    </button>
                  )}
                </div>
              ) : (
                <button disabled className="w-full bg-gray-300 text-gray-600 px-4 py-2 rounded">
                  Out of Stock
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
