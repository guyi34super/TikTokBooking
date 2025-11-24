import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Products
export const fetchProducts = async (type?: 'product' | 'service') => {
  const response = await api.get('/products', { params: { type } });
  return response.data;
};

export const fetchProductDetail = async (id: string) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

// Orders
export const createOrder = async (items: Array<{ product_id: string; quantity: number }>) => {
  const response = await api.post('/orders', { items });
  return response.data;
};

export const fetchMyOrders = async () => {
  const response = await api.get('/orders');
  return response.data;
};

export const fetchOrderDetail = async (id: string) => {
  const response = await api.get(`/orders/${id}`);
  return response.data;
};

export const checkPaymentStatus = async (orderId: string) => {
  const response = await api.get(`/orders/${orderId}/payment-status`);
  return response.data;
};

// Admin
export const fetchAllOrders = async (status?: string, paymentStatus?: string) => {
  const response = await api.get('/admin/orders', {
    params: { status, payment_status: paymentStatus },
  });
  return response.data;
};

export const markOrderAsPaid = async (orderId: string) => {
  const response = await api.post(`/admin/orders/${orderId}/mark-paid`);
  return response.data;
};

export default api;
