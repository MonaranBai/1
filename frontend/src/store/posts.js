import { defineStore } from 'pinia'
import { initialPosts } from '../mock/posts'

export const usePostsStore = defineStore('posts', {
  state: () => ({
    posts: initialPosts,
    myPostIds: [],
    reports: [],
    moderationLogs: []
  }),
  getters: {
    sortedPosts: (state) => [...state.posts].sort((a, b) => Number(b.id) - Number(a.id))
  },
  actions: {
    addPost(payload) {
      const id = this.posts.length ? Math.max(...this.posts.map((item) => item.id)) + 1 : 1
      this.posts.unshift({
        id,
        publisher: payload.publisher || '匿名同学',
        ...payload,
        createdAt: new Date().toLocaleString('zh-CN', { hour12: false })
      })
      this.myPostIds.unshift(id)
      return id
    },
    removePost(id) {
      this.posts = this.posts.filter((item) => item.id !== id)
    },
    getById(id) {
      return this.posts.find((item) => item.id === Number(id))
    },
    reportPost(postId, reason, reporter = '游客') {
      this.reports.push({
        id: this.reports.length + 1,
        postId,
        reason,
        reporter,
        status: 'pending',
        adminNote: '',
        createdAt: new Date().toLocaleString('zh-CN', { hour12: false })
      })
    },
    handleReport(id, status, adminNote = '') {
      const report = this.reports.find((item) => item.id === id)
      if (!report) return
      report.status = status
      report.adminNote = adminNote
    },
    addModerationLog(payload) {
      this.moderationLogs.unshift({
        id: this.moderationLogs.length + 1,
        ...payload,
        createdAt: new Date().toLocaleString('zh-CN', { hour12: false })
      })
    }
  }
})