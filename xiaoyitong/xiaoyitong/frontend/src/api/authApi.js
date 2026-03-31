import { ENDPOINTS } from './endpoints'
import { USE_MOCK_API, httpClient } from './httpClient'

export const authApi = {
  async login(payload) {
    if (USE_MOCK_API) {
      return Promise.resolve({ code: 200, data: payload, message: 'mock login success' })
    }
    return httpClient.post(ENDPOINTS.auth.login, payload)
  },
  async register(payload) {
    if (USE_MOCK_API) {
      return Promise.resolve({ code: 200, data: payload, message: 'mock register success' })
    }
    return httpClient.post(ENDPOINTS.auth.register, payload)
  },
  async adminLogin(payload) {
    if (USE_MOCK_API) {
      return Promise.resolve({ code: 200, data: payload, message: 'mock admin login success' })
    }
    return httpClient.post(ENDPOINTS.auth.adminLogin, payload)
  },
  async getProfile() {
    if (USE_MOCK_API) {
      return Promise.resolve({ code: 200, data: null, message: 'mock profile success' })
    }
    return httpClient.get(ENDPOINTS.auth.profile)
  }
}
