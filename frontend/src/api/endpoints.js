export const ENDPOINTS = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    profile: '/api/auth/profile',
    adminLogin: '/api/admin/login'
  },
  posts: {
    list: '/api/posts',
    detail: (id) => `/api/posts/${id}`,
    create: '/api/posts',
    remove: (id) => `/api/posts/${id}`,
    report: '/api/reports',
    moderationLogs: '/api/moderation/logs'
  },
  tasks: {
    list: '/api/tasks',
    detail: (id) => `/api/tasks/${id}`,
    create: '/api/tasks',
    apply: (id) => `/api/tasks/${id}/apply`,
    status: (id) => `/api/tasks/${id}/status`,
    evaluate: (id) => `/api/tasks/${id}/evaluate`,
    recommendation: '/api/tasks/recommendation'
  },
  buddies: {
    list: '/api/buddies',
    detail: (id) => `/api/buddies/${id}`,
    create: '/api/buddies',
    join: (id) => `/api/buddies/${id}/join`,
    status: (id) => `/api/buddies/${id}/status`,
    evaluate: (id) => `/api/buddies/${id}/evaluate`,
    report: (id) => `/api/buddies/${id}/report`
  },
  admin: {
    users: '/api/admin/users',
    userStatus: (id) => `/api/admin/users/${id}/status`,
    userCredit: (id) => `/api/admin/users/${id}/credit`,
    verifyReview: (id) => `/api/admin/users/${id}/verify`,
    reports: '/api/admin/reports',
    buddyReports: '/api/admin/buddy-reports',
    buddies: '/api/admin/buddies',
    buddyStatus: (id) => `/api/admin/buddies/${id}/status`,
    buddyReportStatus: (id) => `/api/admin/buddy-reports/${id}/status`
  }
}
