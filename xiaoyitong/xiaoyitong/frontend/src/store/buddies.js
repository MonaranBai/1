import { defineStore } from 'pinia'
import { initialBuddies } from '../mock/buddies'
import { useAuthStore } from './auth'

const ratingScoreMap = {
  good: 2,
  neutral: 0,
  bad: -2
}

export const useBuddiesStore = defineStore('buddies', {
  state: () => ({
    buddies: initialBuddies,
    evaluations: [],
    reports: []
  }),
  getters: {
    sortedBuddies: (state) => [...state.buddies].sort((a, b) => Number(b.id) - Number(a.id)),
    openBuddies: (state) => state.buddies.filter((item) => item.status === 'open')
  },
  actions: {
    getById(id) {
      return this.buddies.find((item) => item.id === Number(id))
    },
    createBuddy(payload) {
      const nextId = this.buddies.length ? Math.max(...this.buddies.map((item) => item.id)) + 1 : 1
      const creatorMember = { userId: payload.creatorId, nickname: payload.creatorName }

      this.buddies.unshift({
        id: nextId,
        title: payload.title,
        activityType: payload.activityType,
        location: payload.location,
        latitude: Number(payload.latitude || 0),
        longitude: Number(payload.longitude || 0),
        radiusMeter: Number(payload.radiusMeter || 500),
        distanceMeter: Number(payload.distanceMeter || 0),
        eventTime: payload.eventTime,
        maxMembers: Number(payload.maxMembers || 2),
        currentMembers: 1,
        tags: payload.tags || [],
        status: 'open',
        creatorId: payload.creatorId,
        creatorName: payload.creatorName,
        members: [creatorMember],
        createdAt: new Date().toLocaleString('zh-CN', { hour12: false })
      })

      return nextId
    },
    joinBuddy(buddyId, userId, nickname) {
      const target = this.getById(buddyId)
      if (!target || target.status !== 'open') return false

      const exists = (target.members || []).some((item) => item.userId === userId)
      if (exists) return false

      target.members = [...(target.members || []), { userId, nickname }]
      target.currentMembers = target.members.length
      if (target.currentMembers >= target.maxMembers) {
        target.status = 'full'
      }
      return true
    },
    completeBuddy(buddyId) {
      const target = this.getById(buddyId)
      if (!target || ['completed', 'cancelled'].includes(target.status)) return false
      target.status = 'completed'
      return true
    },
    updateBuddyStatus(buddyId, status) {
      const target = this.getById(buddyId)
      if (!target) return false
      target.status = status
      return true
    },
    reportBuddy(buddyId, reason, reporter = '游客', reporterId = null) {
      this.reports.unshift({
        id: this.reports.length + 1,
        buddyId,
        reason,
        reporter,
        reporterId,
        status: 'pending',
        adminNote: '',
        createdAt: new Date().toLocaleString('zh-CN', { hour12: false })
      })
    },
    handleBuddyReport(reportId, status, adminNote = '') {
      const target = this.reports.find((item) => item.id === reportId)
      if (!target) return
      target.status = status
      target.adminNote = adminNote
    },
    evaluateBuddy(buddyId, fromUserId, toUserId, rating, comment) {
      const authStore = useAuthStore()
      const change = ratingScoreMap[rating] ?? 0

      this.evaluations.unshift({
        id: this.evaluations.length + 1,
        buddyId,
        fromUserId,
        toUserId,
        rating,
        comment,
        createdAt: new Date().toLocaleString('zh-CN', { hour12: false })
      })

      authStore.changeUserCredit(toUserId, change, `搭子圈活动#${buddyId}互评(${rating})`)
      return change
    },
    filterBuddies({ keyword = '', activityType = '全部', maxDistance = 500 }) {
      let list = this.sortedBuddies

      if (activityType !== '全部') {
        list = list.filter((item) => item.activityType === activityType)
      }

      if (keyword.trim()) {
        const query = keyword.trim()
        list = list.filter((item) => {
          const text = [item.title, item.location, ...(item.tags || [])].join(' ')
          return text.includes(query)
        })
      }

      return list.filter((item) => Number(item.distanceMeter || 0) <= Number(maxDistance || 500))
    }
  }
})
