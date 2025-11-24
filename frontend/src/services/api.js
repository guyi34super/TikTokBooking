import axios from 'axios'

const API_BASE_URL = 'http://localhost:8080'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Products API
export const getProducts = async () => {
  const response = await api.get('/products')
  return response.data
}

export const getProduct = async (id) => {
  const response = await api.get(`/products/${id}`)
  return response.data
}

// Bookings API
export const createBooking = async (bookingData) => {
  const response = await api.post('/bookings', bookingData)
  
  // Track with TikTok
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

export const getBookings = async () => {
  const response = await api.get('/bookings')
  return response.data
}

export const getBooking = async (id) => {
  const response = await api.get(`/bookings/${id}`)
  return response.data
}

// Payments API
export const createPayment = async (paymentData) => {
  const response = await api.post('/payments/create', paymentData)
  return response.data
}

// Admin API
export const getAdminOrders = async () => {
  const response = await api.get('/admin/orders')
  return response.data
}

export const markOrderPaid = async (orderId) => {
  const response = await api.post(`/admin/orders/${orderId}/mark-paid`)
  
  // Track with TikTok
  if (window.ttq) {
    window.ttq.track('CompletePayment', {
      content_type: 'product',
      value: response.data.total_amount,
      currency: 'USD'
    })
  }
  
  return response.data
}

export default api
