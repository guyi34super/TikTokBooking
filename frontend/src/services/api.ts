import axios, { AxiosInstance } from 'axios';

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://api.example.com',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized - attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const { data } = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
          { refresh_token: refreshToken }
        );

        localStorage.setItem('access_token', data.access_token);
        if (data.refresh_token) {
          localStorage.setItem('refresh_token', data.refresh_token);
        }

        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ============================================================================
// BOOKING API
// ============================================================================

export interface BookingCreateRequest {
  product_id: string;
  start_time: string;
  end_time?: string;
  quantity?: number;
  location?: {
    lat: number;
    lon: number;
    address?: string;
    place_id?: string;
  };
  metadata?: any;
}

export interface Booking {
  id: string;
  user_id: string;
  product_id: string;
  provider_id?: string;
  start_time: string;
  end_time?: string;
  quantity: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'FAILED';
  price_amount: number;
  price_currency: string;
  payment_id?: string;
  location_id?: string;
  metadata?: any;
  version: number;
  created_at: string;
  updated_at: string;
}

export const createBooking = async (data: BookingCreateRequest): Promise<Booking> => {
  const response = await apiClient.post('/booking/v1/bookings', data);
  return response.data;
};

export const fetchBookings = async (params?: {
  userId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ items: Booking[]; pagination: any }> => {
  const response = await apiClient.get('/booking/v1/bookings', { params });
  return response.data;
};

export const getBooking = async (bookingId: string): Promise<Booking> => {
  const response = await apiClient.get(`/booking/v1/bookings/${bookingId}`);
  return response.data;
};

export const cancelBooking = async (
  bookingId: string,
  reason?: string
): Promise<Booking> => {
  const response = await apiClient.post(`/booking/v1/bookings/${bookingId}/cancel`, {
    reason,
  });
  return response.data;
};

export const confirmBooking = async (
  bookingId: string,
  paymentId: string
): Promise<Booking> => {
  const response = await apiClient.post(`/booking/v1/bookings/${bookingId}/confirm`, {
    payment_id: paymentId,
  });
  return response.data;
};

// ============================================================================
// PAYMENT API
// ============================================================================

export interface PaymentCreateRequest {
  booking_id: string;
  amount: number;
  currency: string;
  provider?: 'stripe' | 'paypal' | 'manual';
  payment_method_types?: string[];
}

export interface Payment {
  payment_id: string;
  client_secret: string;
  status: string;
}

export const createPayment = async (data: PaymentCreateRequest): Promise<Payment> => {
  const response = await apiClient.post('/payment/v1/payments/create', data);
  return response.data;
};

export const getPayment = async (paymentId: string): Promise<any> => {
  const response = await apiClient.get(`/payment/v1/payments/${paymentId}`);
  return response.data;
};

export const refundPayment = async (
  paymentId: string,
  amount?: number,
  reason?: string
): Promise<any> => {
  const response = await apiClient.post(`/payment/v1/payments/${paymentId}/refund`, {
    amount,
    reason,
  });
  return response.data;
};

// ============================================================================
// PRODUCT/CATALOG API
// ============================================================================

export interface Product {
  id: string;
  name: string;
  description: string;
  type: 'product' | 'service' | 'appointment' | 'event';
  price_amount: number;
  price_currency: string;
  images: any[];
  is_available: boolean;
}

export const fetchProducts = async (params?: {
  category_id?: string;
  search?: string;
  page?: number;
  page_size?: number;
}): Promise<{ items: Product[]; pagination: any }> => {
  const response = await apiClient.get('/catalog/v1/products', { params });
  return response.data;
};

export const getProduct = async (productId: string): Promise<Product> => {
  const response = await apiClient.get(`/catalog/v1/products/${productId}`);
  return response.data;
};

// ============================================================================
// USER API
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar_url?: string;
}

export const getCurrentUser = async (): Promise<User> => {
  const response = await apiClient.get('/user/v1/users/me');
  return response.data;
};

export const updateUser = async (userId: string, data: Partial<User>): Promise<User> => {
  const response = await apiClient.put(`/user/v1/users/${userId}`, data);
  return response.data;
};

// ============================================================================
// AUTH API
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await apiClient.post('/auth/login', credentials);
  return response.data;
};

export const logout = async (): Promise<void> => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

export const register = async (data: {
  email: string;
  password: string;
  name: string;
}): Promise<LoginResponse> => {
  const response = await apiClient.post('/user/v1/users', data);
  return response.data;
};

export default apiClient;
