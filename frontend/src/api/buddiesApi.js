import { ENDPOINTS } from './endpoints'
import { USE_MOCK_API, httpClient } from './httpClient'

export const buddiesApi = {
  async getList(params = {}) {
    if (USE_MOCK_API) {
      return Promise.resolve({ code: 200, data: [], message: 'mock buddies list' })
    }
    return httpClient.get(ENDPOINTS.buddies.list, { params })
  },
  async getDetail(id) {
    if (USE_MOCK_API) {
      return Promise.resolve({ code: 200, data: null, message: 'mock buddies detail' })
    }
    return httpClient.get(ENDPOINTS.buddies.detail(id))
  },
  async create(payload) {
    if (USE_MOCK_API) {
      return Promise.resolve({ code: 200, data: payload, message: 'mock create buddy success' })
    }
    return httpClient.post(ENDPOINTS.buddies.create, payload)
  },
  async join(id, payload) {
    if (USE_MOCK_API) {
      return Promise.resolve({ code: 200, data: payload, message: 'mock join buddy success' })
    }
    return httpClient.post(ENDPOINTS.buddies.join(id), payload)
  },
  async updateStatus(id, payload) {
    if (USE_MOCK_API) {
      return Promise.resolve({ code: 200, data: payload, message: 'mock buddy status update success' })
    }
    return httpClient.patch(ENDPOINTS.buddies.status(id), payload)
  },
  async evaluate(id, payload) {
    if (USE_MOCK_API) {
      return Promise.resolve({ code: 200, data: payload, message: 'mock buddy evaluate success' })
    }
    return httpClient.post(ENDPOINTS.buddies.evaluate(id), payload)
  },
  async report(id, payload) {
    if (USE_MOCK_API) {
      return Promise.resolve({ code: 200, data: payload, message: 'mock buddy report success' })
    }
    return httpClient.post(ENDPOINTS.buddies.report(id), payload)
  }
}
