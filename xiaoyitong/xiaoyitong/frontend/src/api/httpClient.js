import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || ''

export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false'

export const httpClient = axios.create({
  baseURL,
  timeout: 10000
})

httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

httpClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    return Promise.reject(error)
  }
)
