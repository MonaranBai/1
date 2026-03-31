<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showConfirmDialog, showToast } from 'vant'
import { useAuthStore } from '../store/auth'
import { useBuddiesStore } from '../store/buddies'
import { buddiesApi } from '../api/buddiesApi'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const buddiesStore = useBuddiesStore()
const reportPopup = ref(false)
const reportReason = ref('')

const buddy = computed(() => buddiesStore.getById(route.params.id))

const statusTypeMap = {
  open: 'primary',
  full: 'warning',
  completed: 'success',
  cancelled: 'danger'
}

const statusTextMap = {
  open: '可加入',
  full: '已满员',
  completed: '已结束',
  cancelled: '已取消'
}

const joinBuddy = async () => {
  if (!buddy.value) return
  if (!authStore.isLoggedIn) {
    showToast('请先登录')
    return
  }
  if (!authStore.user?.isVerified) {
    showToast('请先完成学生认证')
    return
  }
  if (authStore.isCurrentUserRestricted) {
    showToast('信用分低于60，暂不可加入')
    return
  }
  if (Number(buddy.value.distanceMeter || 0) > Number(buddy.value.radiusMeter || 500)) {
    showToast('你当前不在活动匹配范围内')
    return
  }

  await buddiesApi.join(buddy.value.id, { userId: authStore.user.id })
  const ok = buddiesStore.joinBuddy(buddy.value.id, authStore.user.id, authStore.user.nickname)
  if (!ok) {
    showToast('当前活动不可加入或你已在队伍中')
    return
  }
  showToast('加入成功')
}

const finishBuddy = async () => {
  if (!buddy.value) return
  await showConfirmDialog({ title: '结束组队', message: '确认结束本次搭子活动？' })
  await buddiesApi.updateStatus(buddy.value.id, { status: 'completed' })
  const ok = buddiesStore.completeBuddy(buddy.value.id)
  if (ok) showToast('活动已结束，可进行互评')
}

const quickEvaluate = async (rating) => {
  if (!buddy.value || !authStore.isLoggedIn) return
  const members = (buddy.value.members || []).filter((member) => member.userId !== authStore.user.id)
  const target = members[0]
  if (!target) {
    showToast('暂无可评价成员')
    return
  }

  await buddiesApi.evaluate(buddy.value.id, { rating, toUserId: target.userId })
  const change = buddiesStore.evaluateBuddy(buddy.value.id, authStore.user.id, target.userId, rating, '搭子圈活动互评')
  showToast(`互评完成，信用分变动 ${change >= 0 ? '+' : ''}${change}`)
}

const openReport = () => {
  if (!authStore.isLoggedIn) {
    showToast('请先登录后举报')
    return
  }
  reportReason.value = ''
  reportPopup.value = true
}

const submitReport = async () => {
  if (!buddy.value || !reportReason.value.trim()) {
    showToast('请填写举报原因')
    return
  }
  const payload = {
    reason: reportReason.value.trim(),
    reporter: authStore.user.nickname,
    reporterId: authStore.user.id
  }

  await buddiesApi.report(buddy.value.id, payload)
  buddiesStore.reportBuddy(buddy.value.id, payload.reason, payload.reporter, payload.reporterId)
  reportPopup.value = false
  showToast('举报已提交')
}
</script>

<template>
  <div class="page">
    <van-nav-bar title="搭子详情" left-arrow @click-left="router.back()" />

    <van-empty v-if="!buddy" description="活动不存在或已删除" />

    <van-cell-group v-else inset class="buddy-card soft-card">
      <van-cell :title="buddy.title" :label="`${buddy.activityType} · ${buddy.location}`">
        <template #value>
          <van-tag :type="statusTypeMap[buddy.status] || 'default'">{{ statusTextMap[buddy.status] || buddy.status }}</van-tag>
        </template>
      </van-cell>
      <van-cell title="发起人" :value="buddy.creatorName" />
      <van-cell title="活动时间" :value="buddy.eventTime || '未填写'" />
      <van-cell title="匹配范围" :value="`${buddy.radiusMeter || 500}米`" />
      <van-cell title="当前距离" :value="`${buddy.distanceMeter || 0}米`" />
      <van-cell title="成员人数" :value="`${buddy.currentMembers}/${buddy.maxMembers}`" />
      <van-cell title="兴趣标签" :value="(buddy.tags || []).join('、') || '无'" />
      <van-cell title="成员名单" :value="(buddy.members || []).map((m) => m.nickname).join('、') || '暂无'" />

      <div class="actions">
        <van-button v-if="buddy.status === 'open'" size="small" type="primary" plain @click="joinBuddy">加入组队</van-button>
        <van-button v-if="buddy.creatorId === authStore.user.id && ['open', 'full'].includes(buddy.status)" size="small" type="warning" plain @click="finishBuddy">结束活动</van-button>
        <van-button v-if="buddy.status === 'completed' && authStore.isLoggedIn" size="small" type="success" plain @click="quickEvaluate('good')">互评(+2)</van-button>
        <van-button size="small" type="danger" plain @click="openReport">举报</van-button>
      </div>
    </van-cell-group>

    <van-popup v-model:show="reportPopup" round position="bottom" :style="{ padding: '16px' }">
      <h3 style="margin: 0 0 10px;">举报搭子活动</h3>
      <van-field v-model="reportReason" label="原因" type="textarea" rows="3" placeholder="请填写举报原因，如骚扰、虚假活动等" />
      <div class="actions" style="padding: 12px 0 0;">
        <van-button block type="danger" @click="submitReport">提交举报</van-button>
      </div>
    </van-popup>
  </div>
</template>

<style scoped>
.buddy-card {
  margin-top: 12px;
  border-radius: 14px;
}

.actions {
  padding: 0 16px 14px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
