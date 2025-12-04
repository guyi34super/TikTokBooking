import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 errors (expired token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.reload()
    }
    return Promise.reject(error)
  }
)

// Products API
export const getProducts = async () => {
  const response = await api.get('/products')
  return response.data
}

export const getProduct = async (id) => {
  const response = await api.get(`/products/${id}`)
  return response.data
}

// Orders/Bookings API
export const createBooking = async (bookingData) => {
  const response = await api.post('/bookings', bookingData)
  
  // Track with TikTok if available
  if (window.ttq) {
    window.ttq.track('InitiateCheckout', {
      content_type: 'product',
      value: bookingData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      currency: 'USD',
      contents: bookingData.items
    })
  }
  
  return response.data
}

export const getOrders = async () => {
  const response = await api.get('/bookings')
  return response.data
}

export const getOrder = async (id) => {
  const response = await api.get(`/bookings/${id}`)
  return response.data
}

// Admin API
export const getAdminOrders = async () => {
  const response = await api.get('/admin/orders')
  return response.data
}

export const markOrderPaid = async (orderId) => {
  const response = await api.post(`/admin/orders/${orderId}/mark-paid`)
  
  // Track with TikTok if available
  if (window.ttq) {
    window.ttq.track('CompletePayment', {
      content_type: 'product',
      value: response.data.total_amount,
      currency: 'USD'
    })
  }
  
  return response.data
}

// Sellers API
export const getSellers = async () => {
  const response = await api.get('/sellers')
  return response.data
}

export const getSeller = async (id) => {
  const response = await api.get(`/sellers/${id}`)
  return response.data
}

export default api
