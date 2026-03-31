import { ENDPOINTS } from './endpoints'
import { USE_MOCK_API, httpClient } from './httpClient'

export const tasksApi = {
  async getList(params = {}) {
    if (USE_MOCK_API) {
      return Promise.resolve({ code: 200, data: [], message: 'mock task list' })
    }
    return httpClient.get(ENDPOINTS.tasks.list, { params })
  },
  async getDetail(id) {
    if (USE_MOCK_API) {
      return Promise.resolve({ code: 200, data: null, message: 'mock task detail' })
    }
    return httpClient.get(ENDPOINTS.tasks.detail(id))
  },
  async create(payload) {
    if (USE_MOCK_API) {
      return Promise.resolve({ code: 200, data: payload, message: 'mock create task success' })
    }
    return httpClient.post(ENDPOINTS.tasks.create, payload)
  },
  async apply(id, payload) {
    if (USE_MOCK_API) {
      return Promise.resolve({ code: 200, data: payload, message: 'mock apply task success' })
    }
    return httpClient.post(ENDPOINTS.tasks.apply(id), payload)
  },
  async updateStatus(id, payload) {
    if (USE_MOCK_API) {
      return Promise.resolve({ code: 200, data: payload, message: 'mock task status update success' })
    }
    return httpClient.patch(ENDPOINTS.tasks.status(id), payload)
  },
  async evaluate(id, payload) {
    if (USE_MOCK_API) {
      return Promise.resolve({ code: 200, data: payload, message: 'mock evaluate success' })
    }
    return httpClient.post(ENDPOINTS.tasks.evaluate(id), payload)
  }
}
