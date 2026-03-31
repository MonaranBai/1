import { defineStore } from 'pinia'

const createGuestUser = () => ({
  id: null,
  nickname: '未登录用户',
  phone: '',
  studentId: '',
  campus: '主校区',
  qq: '',
  wechat: '',
  avatar: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
  studentCardImage: '',
  verificationStatus: 'unverified',
  isVerified: false,
  creditScore: 100,
  creditLogs: [],
  status: 'active',
  createdAt: ''
})

const defaultUsers = [
  {
    id: 1,
    nickname: '骑行社小李',
    phone: '13800000001',
    studentId: '20221001',
    campus: '主校区',
    qq: '10001',
    wechat: 'biker_li',
    avatar: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
    studentCardImage: '',
    verificationStatus: 'verified',
    isVerified: true,
    creditScore: 96,
    creditLogs: [
      { change: 2, reason: '完成代取快递，获得好评', createdAt: '2026-03-06 20:10' },
      { change: -1, reason: '任务响应超时', createdAt: '2026-03-03 12:20' }
    ],
    status: 'active',
    createdAt: '2026-03-01 10:00'
  },
  {
    id: 2,
    nickname: '法学院-小陈',
    phone: '13800000002',
    studentId: '20218021',
    campus: '南校区',
    qq: '20002',
    wechat: 'chen_law',
    avatar: 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
    studentCardImage: '',
    verificationStatus: 'unverified',
    isVerified: false,
    creditScore: 88,
    creditLogs: [
      { change: -2, reason: '租房信息不完整被差评', createdAt: '2026-03-07 09:30' }
    ],
    status: 'active',
    createdAt: '2026-03-02 09:20'
  }
]

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isAdminLoggedIn: false,
    admin: {
      account: 'admin',
      password: 'admin123',
      nickname: '平台管理员'
    },
    isLoggedIn: false,
    nextUserId: 3,
    users: defaultUsers,
    user: createGuestUser()
  }),
  getters: {
    pendingUsers: (state) => state.users.filter((item) => item.verificationStatus === 'pending'),
    activeUsers: (state) => state.users.filter((item) => item.status === 'active'),
    currentUserCredit: (state) => state.user?.creditScore || 0,
    isCurrentUserRestricted: (state) => (state.user?.creditScore || 0) < 60
  },
  actions: {
    syncUserToList() {
      if (!this.user.id) return
      const index = this.users.findIndex((item) => item.id === this.user.id)
      if (index >= 0) {
        this.users[index] = {
          ...this.users[index],
          ...this.user
        }
      }
    },
    login(phone, nickname = '校园同学') {
      const existed = this.users.find((item) => item.phone === phone)
      if (existed) {
        if (existed.status === 'disabled') return false
        this.user = {
          ...existed
        }
      } else {
        this.user = {
          ...createGuestUser(),
          id: this.nextUserId,
          nickname,
          phone,
          createdAt: new Date().toLocaleString('zh-CN', { hour12: false })
        }
        this.nextUserId += 1
        this.users.unshift({
          ...this.user
        })
      }
      this.isLoggedIn = true
      return true
    },
    register(payload) {
      this.user = {
        ...createGuestUser(),
        id: this.nextUserId,
        nickname: payload.nickname,
        phone: payload.phone,
        studentId: payload.studentId,
        wechat: payload.wechat,
        qq: payload.qq,
        campus: payload.campus || '主校区',
        creditScore: 100,
        creditLogs: [{ change: 0, reason: '新用户注册', createdAt: new Date().toLocaleString('zh-CN', { hour12: false }) }],
        verificationStatus: 'unverified',
        isVerified: false,
        createdAt: new Date().toLocaleString('zh-CN', { hour12: false })
      }
      this.nextUserId += 1
      this.users.unshift({
        ...this.user
      })
      this.isLoggedIn = true
      return true
    },
    updateProfile(payload) {
      this.user = {
        ...this.user,
        ...payload
      }
      this.syncUserToList()
    },
    submitStudentVerification(studentCardImage) {
      this.user.studentCardImage = studentCardImage
      this.user.verificationStatus = 'pending'
      this.user.isVerified = false
      this.syncUserToList()
    },
    approveStudentVerification() {
      this.user.verificationStatus = 'verified'
      this.user.isVerified = true
      this.syncUserToList()
    },
    reviewUserVerification(userId, approved) {
      const index = this.users.findIndex((item) => item.id === userId)
      if (index < 0) return
      this.users[index].verificationStatus = approved ? 'verified' : 'rejected'
      this.users[index].isVerified = approved

      if (this.user.id === userId) {
        this.user = {
          ...this.user,
          verificationStatus: this.users[index].verificationStatus,
          isVerified: this.users[index].isVerified
        }
      }
    },
    updateUserStatus(userId, status) {
      const index = this.users.findIndex((item) => item.id === userId)
      if (index < 0) return
      this.users[index].status = status
      if (this.user.id === userId) {
        this.user.status = status
      }
    },
    changeUserCredit(userId, change, reason) {
      const index = this.users.findIndex((item) => item.id === userId)
      if (index < 0) return
      const current = Number(this.users[index].creditScore || 100)
      const next = Math.max(0, Math.min(100, current + Number(change || 0)))
      this.users[index].creditScore = next
      if (!Array.isArray(this.users[index].creditLogs)) this.users[index].creditLogs = []
      this.users[index].creditLogs.unshift({
        change: Number(change || 0),
        reason,
        createdAt: new Date().toLocaleString('zh-CN', { hour12: false })
      })

      if (this.user.id === userId) {
        this.user = {
          ...this.user,
          creditScore: next,
          creditLogs: [...this.users[index].creditLogs]
        }
      }
    },
    removeUser(userId) {
      this.users = this.users.filter((item) => item.id !== userId)
      if (this.user.id === userId) {
        this.logout()
      }
    },
    adminLogin(account, password) {
      const ok = account === this.admin.account && password === this.admin.password
      this.isAdminLoggedIn = ok
      return ok
    },
    adminLogout() {
      this.isAdminLoggedIn = false
    },
    logout() {
      this.isLoggedIn = false
      this.user = createGuestUser()
    }
  }
})