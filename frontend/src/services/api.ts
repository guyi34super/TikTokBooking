import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests (for demo, we'll use a simple flag)
let isAdminMode = false;

export const setAdminMode = (admin: boolean) => {
  isAdminMode = admin;
};

api.interceptors.request.use((config) => {
  if (isAdminMode) {
    config.headers.Authorization = 'Bearer admin-token';
  } else {
    config.headers.Authorization = 'Bearer user-token';
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
export const createOrder = async (items: Array<{ product_id: string; quantity: number }>, notes?: string) => {
  const response = await api.post('/orders', { items, notes });
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
