import { ENDPOINTS } from './endpoints'
import { USE_MOCK_API, httpClient } from './httpClient'

export const postsApi = {
  async getList(params = {}) {
    if (USE_MOCK_API) {
      return Promise.resolve({ code: 200, data: [], message: 'mock posts list' })
    }
    return httpClient.get(ENDPOINTS.posts.list, { params })
  },
  async getDetail(id) {
    if (USE_MOCK_API) {
      return Promise.resolve({ code: 200, data: null, message: 'mock post detail' })
    }
    return httpClient.get(ENDPOINTS.posts.detail(id))
  },
  async create(payload) {
    if (USE_MOCK_API) {
      return Promise.resolve({ code: 200, data: payload, message: 'mock create post success' })
    }
    return httpClient.post(ENDPOINTS.posts.create, payload)
  },
  async remove(id) {
    if (USE_MOCK_API) {
      return Promise.resolve({ code: 200, data: { id }, message: 'mock remove post success' })
    }
    return httpClient.delete(ENDPOINTS.posts.remove(id))
  },
  async report(payload) {
    if (USE_MOCK_API) {
      return Promise.resolve({ code: 200, data: payload, message: 'mock report success' })
    }
    return httpClient.post(ENDPOINTS.posts.report, payload)
  }
}
