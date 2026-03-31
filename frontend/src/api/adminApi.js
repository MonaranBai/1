import { ENDPOINTS } from './endpoints'
import { USE_MOCK_API, httpClient } from './httpClient'

export const adminApi = {
  async getUsers() {
    if (USE_MOCK_API) {
      return Promise.resolve({ code: 200, data: [], message: 'mock users' })
    }
    return httpClient.get(ENDPOINTS.admin.users)
  },
  async updateUserStatus(id, payload) {
    if (USE_MOCK_API) {
      return Promise.resolve({ code: 200, data: payload, message: 'mock update user status' })
    }
    return httpClient.patch(ENDPOINTS.admin.userStatus(id), payload)
  },
  async updateUserCredit(id, payload) {
    if (USE_MOCK_API) {
      return Promise.resolve({ code: 200, data: payload, message: 'mock update user credit' })
    }
    return httpClient.patch(ENDPOINTS.admin.userCredit(id), payload)
  },
  async reviewUserVerification(id, payload) {
    if (USE_MOCK_API) {
      return Promise.resolve({ code: 200, data: payload, message: 'mock review verification' })
    }
    return httpClient.patch(ENDPOINTS.admin.verifyReview(id), payload)
  },
  async getReports() {
    if (USE_MOCK_API) {
      return Promise.resolve({ code: 200, data: [], message: 'mock reports' })
    }
    return httpClient.get(ENDPOINTS.admin.reports)
  },
  async getBuddyReports() {
    if (USE_MOCK_API) {
      return Promise.resolve({ code: 200, data: [], message: 'mock buddy reports' })
    }
    return httpClient.get(ENDPOINTS.admin.buddyReports)
  },
  async updateBuddyReportStatus(id, payload) {
    if (USE_MOCK_API) {
      return Promise.resolve({ code: 200, data: payload, message: 'mock update buddy report status' })
    }
    return httpClient.patch(ENDPOINTS.admin.buddyReportStatus(id), payload)
  },
  async getBuddies() {
    if (USE_MOCK_API) {
      return Promise.resolve({ code: 200, data: [], message: 'mock buddies' })
    }
    return httpClient.get(ENDPOINTS.admin.buddies)
  },
  async updateBuddyStatus(id, payload) {
    if (USE_MOCK_API) {
      return Promise.resolve({ code: 200, data: payload, message: 'mock update buddy status' })
    }
    return httpClient.patch(ENDPOINTS.admin.buddyStatus(id), payload)
  }
}
