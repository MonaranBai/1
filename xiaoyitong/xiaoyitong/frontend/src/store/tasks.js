import { defineStore } from 'pinia'
import { initialTasks } from '../mock/tasks'
import { useAuthStore } from './auth'

export const useTasksStore = defineStore('tasks', {
  state: () => ({
    tasks: initialTasks,
    applications: [],
    evaluations: [],
    behaviors: []
  }),
  getters: {
    sortedTasks: (state) => [...state.tasks].sort((a, b) => Number(b.id) - Number(a.id)),
    pendingTasks: (state) => state.tasks.filter((item) => item.status === 'pending')
  },
  actions: {
    addBehavior(userId, targetType, targetId, action, tags = []) {
      this.behaviors.unshift({
        id: this.behaviors.length + 1,
        userId,
        targetType,
        targetId,
        action,
        tags,
        createdAt: new Date().toLocaleString('zh-CN', { hour12: false })
      })
    },
    addTask(payload) {
      const id = this.tasks.length ? Math.max(...this.tasks.map((item) => item.id)) + 1 : 1
      this.tasks.unshift({
        id,
        ...payload,
        images: payload.images || [],
        status: 'pending',
        helperId: null,
        helperName: '',
        createdAt: new Date().toLocaleString('zh-CN', { hour12: false })
      })
      return id
    },
    applyTask(taskId, helperId, helperName) {
      const task = this.tasks.find((item) => item.id === taskId)
      if (!task || task.status !== 'pending') return false
      this.applications.unshift({
        id: this.applications.length + 1,
        taskId,
        helperId,
        helperName,
        status: 'accepted',
        appliedAt: new Date().toLocaleString('zh-CN', { hour12: false })
      })
      task.status = 'ongoing'
      task.helperId = helperId
      task.helperName = helperName
      return true
    },
    markTaskPendingConfirm(taskId) {
      const task = this.tasks.find((item) => item.id === taskId)
      if (!task || task.status !== 'ongoing') return false
      task.status = 'pending_confirm'
      return true
    },
    confirmTaskComplete(taskId) {
      const task = this.tasks.find((item) => item.id === taskId)
      if (!task || !['ongoing', 'pending_confirm'].includes(task.status)) return false
      task.status = 'completed'
      return true
    },
    cancelTask(taskId) {
      const task = this.tasks.find((item) => item.id === taskId)
      if (!task || ['completed', 'cancelled'].includes(task.status)) return false
      task.status = 'cancelled'
      return true
    },
    evaluateTask(taskId, fromUserId, toUserId, rating, comment) {
      const authStore = useAuthStore()
      const scoreMap = { good: 2, neutral: 0, bad: -2 }
      const change = scoreMap[rating] ?? 0
      const reason = `任务#${taskId}评价(${rating})`

      this.evaluations.unshift({
        id: this.evaluations.length + 1,
        taskId,
        fromUserId,
        toUserId,
        rating,
        comment,
        createdAt: new Date().toLocaleString('zh-CN', { hour12: false })
      })

      authStore.changeUserCredit(toUserId, change, reason)
      return change
    },
    getTaskById(taskId) {
      return this.tasks.find((item) => item.id === Number(taskId))
    },
    recommendTasksForUser(userId) {
      const userBehaviors = this.behaviors.filter((item) => item.userId === userId)
      const tags = userBehaviors.flatMap((item) => item.tags || [])
      const weightMap = tags.reduce((acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1
        return acc
      }, {})

      if (!Object.keys(weightMap).length) {
        return this.sortedTasks.slice(0, 3)
      }

      return [...this.tasks]
        .map((task) => {
          const score = (task.tags || []).reduce((sum, tag) => sum + (weightMap[tag] || 0), 0)
          return { task, score }
        })
        .sort((a, b) => b.score - a.score)
        .map((item) => item.task)
        .slice(0, 3)
    }
  }
})
