<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useAuthStore } from '../store/auth'
import { usePostsStore } from '../store/posts'
import { useTasksStore } from '../store/tasks'
import { useBuddiesStore } from '../store/buddies'
import { adminApi } from '../api/adminApi'

const router = useRouter()
const authStore = useAuthStore()
const postsStore = usePostsStore()
const tasksStore = useTasksStore()
const buddiesStore = useBuddiesStore()
const active = ref(0)
const userKeyword = ref('')

const isMobile = computed(() => window.innerWidth < 900)

const overviewCols = computed(() => (isMobile.value ? 12 : 6))

const displayUsers = computed(() => {
  const key = userKeyword.value.trim()
  if (!key) return authStore.users
  return authStore.users.filter((item) => `${item.nickname} ${item.phone} ${item.studentId}`.includes(key))
})

const reportRows = computed(() => {
  return postsStore.reports.map((item) => {
    const post = postsStore.getById(item.postId)
    return {
      ...item,
      title: post ? post.title : '内容已删除',
      reportType: 'post'
    }
  })
})

const buddyReportRows = computed(() => {
  return buddiesStore.reports.map((item) => {
    const buddy = buddiesStore.getById(item.buddyId)
    return {
      ...item,
      title: buddy ? buddy.title : '活动已删除',
      reportType: 'buddy'
    }
  })
})

const unifiedReportRows = computed(() => [...reportRows.value, ...buddyReportRows.value])

const moderationRows = computed(() => postsStore.moderationLogs.slice(0, 20))

const requireAdmin = () => {
  if (!authStore.isAdminLoggedIn) {
    showToast('请先登录管理员账号')
    router.replace('/auth')
    return false
  }
  return true
}

if (!requireAdmin()) {
  // intentionally empty
}

const logoutAdmin = () => {
  authStore.adminLogout()
  showToast('已退出管理员登录')
  router.replace('/auth')
}

const approveUser = (id) => {
  adminApi.reviewUserVerification(id, { approved: true })
  authStore.reviewUserVerification(id, true)
  showToast('审核通过')
}

const rejectUser = (id) => {
  adminApi.reviewUserVerification(id, { approved: false })
  authStore.reviewUserVerification(id, false)
  showToast('已驳回')
}

const disableUser = (id) => {
  adminApi.updateUserStatus(id, { status: 'disabled' })
  authStore.updateUserStatus(id, 'disabled')
  showToast('用户已禁用')
}

const enableUser = (id) => {
  adminApi.updateUserStatus(id, { status: 'active' })
  authStore.updateUserStatus(id, 'active')
  showToast('用户已恢复')
}

const removeUser = (id) => {
  authStore.removeUser(id)
  showToast('用户已删除')
}

const handleReport = (id, status, reportType) => {
  if (reportType === 'buddy') {
    adminApi.getBuddyReports()
    adminApi.updateBuddyReportStatus(id, { status })
    buddiesStore.handleBuddyReport(id, status, status === 'resolved' ? '已处理并记录' : '无需处理')
    showToast('搭子举报状态已更新')
    return
  }

  adminApi.getReports()
  postsStore.handleReport(id, status, status === 'resolved' ? '已处理并记录' : '无需处理')
  showToast('举报状态已更新')
}

const removePost = (id) => {
  postsStore.removePost(id)
  showToast('内容已删除')
}

const finishTask = (taskId) => {
  tasksStore.confirmTaskComplete(taskId)
  showToast('任务状态已设为已完成')
}

const cancelTask = (taskId) => {
  tasksStore.cancelTask(taskId)
  showToast('任务已取消')
}

const completeBuddyByAdmin = (buddyId) => {
  adminApi.updateBuddyStatus(buddyId, { status: 'completed' })
  buddiesStore.updateBuddyStatus(buddyId, 'completed')
  showToast('搭子活动已结束')
}

const cancelBuddyByAdmin = (buddyId) => {
  adminApi.updateBuddyStatus(buddyId, { status: 'cancelled' })
  buddiesStore.updateBuddyStatus(buddyId, 'cancelled')
  showToast('搭子活动已下架')
}

const addCredit = (userId) => {
  adminApi.updateUserCredit(userId, { change: 2 })
  authStore.changeUserCredit(userId, 2, '管理员加分')
  showToast('已加2分')
}

const minusCredit = (userId) => {
  adminApi.updateUserCredit(userId, { change: -2 })
  authStore.changeUserCredit(userId, -2, '管理员扣分')
  showToast('已扣2分')
}
</script>

<template>
  <div class="page admin-page">
    <van-nav-bar title="管理员后台" />

    <div class="hero-banner soft-card">
      <div class="hero-title">校园运营控制台</div>
      <div class="hero-subtitle">用户、内容、任务、搭子活动一站式治理</div>
    </div>

    <van-tabs v-model:active="active" sticky class="admin-tabs">
      <van-tab title="数据概览">
        <van-row gutter="10" class="overview-row">
          <van-col :span="overviewCols"><div class="panel"><strong>{{ authStore.users.length }}</strong><span>用户总数</span></div></van-col>
          <van-col :span="overviewCols"><div class="panel"><strong>{{ postsStore.posts.length }}</strong><span>信息总数</span></div></van-col>
          <van-col :span="overviewCols"><div class="panel"><strong>{{ tasksStore.tasks.length }}</strong><span>任务总数</span></div></van-col>
          <van-col :span="overviewCols"><div class="panel"><strong>{{ buddiesStore.buddies.length }}</strong><span>搭子活动数</span></div></van-col>
          <van-col :span="overviewCols"><div class="panel"><strong>{{ authStore.pendingUsers.length }}</strong><span>待审核用户</span></div></van-col>
          <van-col :span="overviewCols"><div class="panel"><strong>{{ postsStore.reports.filter((r) => r.status === 'pending').length + buddiesStore.reports.filter((r) => r.status === 'pending').length }}</strong><span>待处理举报</span></div></van-col>
          <van-col :span="overviewCols"><div class="panel"><strong>{{ moderationRows.filter((m) => m.result === 'blocked').length }}</strong><span>AI拦截次数</span></div></van-col>
        </van-row>
      </van-tab>

      <van-tab title="用户管理">
        <div class="search-wrap">
          <van-search v-model="userKeyword" placeholder="搜索昵称/手机号/学号" />
        </div>
        <van-cell-group inset class="list-card" v-for="item in displayUsers" :key="item.id">
          <van-cell :title="item.nickname" :label="`手机号：${item.phone} | 学号：${item.studentId || '未填'}`">
            <template #value>
              <van-tag :type="item.status === 'active' ? 'success' : 'danger'">{{ item.status === 'active' ? '正常' : '禁用' }}</van-tag>
            </template>
          </van-cell>
          <div class="row-btns">
            <van-button size="small" plain type="primary" @click="item.status === 'active' ? disableUser(item.id) : enableUser(item.id)">
              {{ item.status === 'active' ? '禁用' : '恢复' }}
            </van-button>
            <van-button size="small" plain type="danger" @click="removeUser(item.id)">删除用户</van-button>
          </div>
        </van-cell-group>
      </van-tab>

      <van-tab title="信用管理">
        <van-cell-group inset class="list-card" v-for="item in authStore.users" :key="`credit-${item.id}`">
          <van-cell :title="item.nickname" :label="`当前信用分：${item.creditScore}`" />
          <div class="row-btns">
            <van-button size="small" plain type="success" @click="addCredit(item.id)">+2分</van-button>
            <van-button size="small" plain type="warning" @click="minusCredit(item.id)">-2分</van-button>
          </div>
        </van-cell-group>
      </van-tab>

      <van-tab title="认证审核">
        <van-empty v-if="!authStore.pendingUsers.length" description="暂无待审核用户" />
        <van-cell-group inset class="list-card" v-for="item in authStore.pendingUsers" :key="item.id">
          <van-cell :title="item.nickname" :label="`学号：${item.studentId || '未填'} | 手机号：${item.phone}`" />
          <div class="row-btns">
            <van-button size="small" type="success" plain @click="approveUser(item.id)">通过</van-button>
            <van-button size="small" type="warning" plain @click="rejectUser(item.id)">驳回</van-button>
          </div>
        </van-cell-group>
      </van-tab>

      <van-tab title="举报处理">
        <van-empty v-if="!unifiedReportRows.length" description="暂无举报数据" />
        <van-cell-group inset class="list-card" v-for="item in unifiedReportRows" :key="`${item.reportType}-${item.id}`">
          <van-cell :title="item.title" :label="`举报人：${item.reporter} | 原因：${item.reason}`">
            <template #value>
              <div style="display: flex; gap: 6px; align-items: center;">
                <van-tag plain :type="item.reportType === 'buddy' ? 'primary' : 'default'">{{ item.reportType === 'buddy' ? '搭子圈' : '信息流' }}</van-tag>
                <van-tag :type="item.status === 'pending' ? 'warning' : 'success'">
                  {{ item.status === 'pending' ? '待处理' : '已处理' }}
                </van-tag>
              </div>
            </template>
          </van-cell>
          <div class="row-btns">
            <van-button size="small" type="success" plain @click="handleReport(item.id, 'resolved', item.reportType)">标记已处理</van-button>
            <van-button size="small" plain @click="handleReport(item.id, 'ignored', item.reportType)">忽略</van-button>
          </div>
        </van-cell-group>
      </van-tab>

      <van-tab title="内容管理">
        <van-cell-group inset class="list-card" v-for="item in postsStore.sortedPosts" :key="item.id">
          <van-cell :title="item.title" :label="`分类：${item.category} | 发布者：${item.publisher || '匿名同学'}`" />
          <div class="row-btns">
            <van-button size="small" plain type="danger" @click="removePost(item.id)">删除内容</van-button>
          </div>
        </van-cell-group>
      </van-tab>

      <van-tab title="任务管理">
        <van-cell-group inset class="list-card" v-for="task in tasksStore.sortedTasks" :key="`task-${task.id}`">
          <van-cell :title="task.title" :label="`状态：${task.status} | 发布者：${task.publisher}`" />
          <div class="row-btns">
            <van-button size="small" plain type="success" @click="finishTask(task.id)">置为完成</van-button>
            <van-button size="small" plain type="danger" @click="cancelTask(task.id)">取消任务</van-button>
          </div>
        </van-cell-group>
      </van-tab>

      <van-tab title="搭子管理">
        <van-cell-group inset class="list-card" v-for="item in buddiesStore.sortedBuddies" :key="`buddy-${item.id}`">
          <van-cell :title="item.title" :label="`状态：${item.status} | 发起人：${item.creatorName}`" />
          <div class="row-btns">
            <van-button size="small" plain type="success" @click="completeBuddyByAdmin(item.id)">结束活动</van-button>
            <van-button size="small" plain type="danger" @click="cancelBuddyByAdmin(item.id)">下架活动</van-button>
          </div>
        </van-cell-group>
      </van-tab>

      <van-tab title="AI审核日志">
        <van-empty v-if="!moderationRows.length" description="暂无审核记录" />
        <van-cell-group inset class="list-card" v-for="item in moderationRows" :key="`log-${item.id}`">
          <van-cell :title="item.title" :label="`${item.reason} · ${item.operator}`">
            <template #value>
              <van-tag :type="item.result === 'blocked' ? 'danger' : 'success'">
                {{ item.result === 'blocked' ? '已拦截' : '通过' }}
              </van-tag>
            </template>
          </van-cell>
        </van-cell-group>
      </van-tab>
    </van-tabs>

    <div class="admin-bottom">
      <van-button type="danger" plain block @click="logoutAdmin">退出管理员</van-button>
    </div>
  </div>
</template>

<style scoped>
.admin-page {
  background: linear-gradient(180deg, var(--van-blue-1) 0%, var(--van-background) 38%, var(--van-background) 100%);
}

.hero-banner {
  margin: 10px 12px 0;
  padding: 12px;
  background: linear-gradient(135deg, var(--van-primary-color) 0%, var(--van-success-color) 100%);
  color: var(--van-white);
}

.hero-title {
  font-size: 16px;
  font-weight: 700;
}

.hero-subtitle {
  margin-top: 4px;
  font-size: 12px;
  opacity: 0.95;
}

.overview-row {
  margin: 12px;
}

.search-wrap {
  margin-top: 6px;
}

.panel {
  background: linear-gradient(180deg, var(--van-background-2) 0%, var(--van-primary-color-light) 100%);
  border-radius: 12px;
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.05);
}

.panel strong {
  font-size: 18px;
}

.panel span {
  color: #969799;
  font-size: 12px;
}

.list-card {
  margin-top: 10px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.05);
}

.row-btns {
  padding: 0 16px 12px;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.row-btns .van-button {
  min-width: 84px;
}

.admin-bottom {
  padding: 14px 12px 20px;
}

.admin-tabs :deep(.van-tabs__nav) {
  background: color-mix(in srgb, var(--van-background-2) 92%, transparent);
  backdrop-filter: blur(6px);
}

@media (min-width: 900px) {
  .admin-page {
    max-width: 1200px;
    margin: 0 auto;
  }
}
</style>
