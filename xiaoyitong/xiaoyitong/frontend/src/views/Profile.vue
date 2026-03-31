<script setup>
import { computed } from 'vue'
import { showToast } from 'vant'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth'
import { usePostsStore } from '../store/posts'

const router = useRouter()
const authStore = useAuthStore()
const postsStore = usePostsStore()

const profileItems = computed(() => {
  if (!authStore.isLoggedIn) {
    return [
      { title: '手机号', value: '未设置' },
      { title: '学号', value: '未设置' },
      { title: '所在校区', value: '未设置' },
      { title: '微信', value: '未设置' },
      { title: 'QQ', value: '未设置' }
    ]
  }
  return [
    { title: '手机号', value: authStore.user.phone || '未设置' },
    { title: '学号', value: authStore.user.studentId || '未设置' },
    { title: '所在校区', value: authStore.user.campus || '未设置' },
    { title: '微信', value: authStore.user.wechat || '未设置' },
    { title: 'QQ', value: authStore.user.qq || '未设置' }
  ]
})

const summary = computed(() => ({
  myPosts: postsStore.myPostIds.length,
  reportCount: postsStore.reports.length,
  credit: authStore.currentUserCredit,
  verified:
    authStore.user.verificationStatus === 'verified'
      ? '已认证'
      : authStore.user.verificationStatus === 'pending'
        ? '审核中'
        : '未认证'
}))

const goAuth = () => {
  if (!authStore.isLoggedIn) {
    router.push('/auth')
    return
  }
  router.push('/profile/edit')
}

const goMyPosts = () => {
  if (!authStore.isLoggedIn) {
    showToast('请先登录')
    router.push('/auth')
    return
  }
  router.push('/my-posts')
}

const goPublish = () => {
  router.push('/publish')
}

const goTasks = () => {
  router.push('/tasks')
}

const goVerification = () => {
  if (!authStore.isLoggedIn) {
    showToast('请先登录')
    router.push('/auth')
    return
  }
  router.push('/verification')
}
</script>

<template>
  <div class="page">
    <van-nav-bar title="个人中心" />

    <div class="profile-head" @click="goAuth">
      <van-image round width="66" height="66" :src="authStore.user.avatar" />
      <div class="profile-head-main">
        <div class="name-line">
          <span class="nickname">{{ authStore.user.nickname }}</span>
          <van-tag v-if="authStore.user.isVerified" type="success" size="medium">学生已认证</van-tag>
        </div>
        <div class="sub-line">
          {{ authStore.isLoggedIn ? '点击可管理资料（演示）' : '点击这里登录 / 注册' }}
        </div>
      </div>
      <van-icon name="arrow" color="#969799" />
    </div>

    <van-row class="summary-row" gutter="8">
      <van-col span="8"><div class="summary-card"><strong>{{ summary.myPosts }}</strong><span>我的发布</span></div></van-col>
      <van-col span="8"><div class="summary-card"><strong>{{ summary.reportCount }}</strong><span>举报记录</span></div></van-col>
      <van-col span="8"><div class="summary-card"><strong>{{ summary.credit }}</strong><span>信用分</span></div></van-col>
    </van-row>

    <van-cell-group inset class="block-gap" v-if="authStore.isLoggedIn">
      <van-cell title="认证状态" :value="summary.verified" />
      <van-cell title="信用说明" :label="authStore.isCurrentUserRestricted ? '信用分低于60，已限制发布/接单' : '信用正常，可正常使用全部功能'" />
      <van-cell
        v-for="(log, idx) in authStore.user.creditLogs?.slice(0, 3) || []"
        :key="`${log.createdAt}-${idx}`"
        :title="`信用变动 ${log.change >= 0 ? '+' : ''}${log.change}`"
        :label="`${log.reason} · ${log.createdAt}`"
      />
    </van-cell-group>

    <van-cell-group inset class="block-gap">
      <van-cell v-for="item in profileItems" :key="item.title" :title="item.title" :value="item.value" />
    </van-cell-group>

    <van-cell-group inset class="block-gap">
      <van-cell title="我的发布" is-link icon="records" @click="goMyPosts" />
      <van-cell title="任务中心" is-link icon="todo-list-o" @click="goTasks" />
      <van-cell title="发布新信息" is-link icon="add-square" @click="goPublish" />
      <van-cell title="学生认证" is-link icon="passed" @click="goVerification" />
      <van-cell v-if="authStore.isAdminLoggedIn" title="管理员后台" is-link icon="setting-o" @click="router.push('/admin')" />
      <van-cell title="联系客服" is-link icon="service-o" />
      <van-cell
        v-if="authStore.isLoggedIn"
        title="退出登录"
        is-link
        icon="cross"
        @click="authStore.logout()"
      />
      <van-cell
        v-else
        title="去登录 / 注册"
        is-link
        icon="contact"
        @click="goAuth"
      />
    </van-cell-group>
  </div>
</template>

<style scoped>
.profile-head {
  margin: 12px 12px 0;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  border-radius: 12px;
}

.profile-head-main {
  flex: 1;
}

.name-line {
  display: flex;
  gap: 8px;
  align-items: center;
}

.nickname {
  font-size: 17px;
  font-weight: 600;
}

.sub-line {
  margin-top: 6px;
  color: #969799;
  font-size: 12px;
}

.summary-row {
  margin: 12px;
}

.summary-card {
  background: #fff;
  border-radius: 10px;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.summary-card strong {
  font-size: 16px;
}

.summary-card span {
  font-size: 12px;
  color: #969799;
}

.block-gap {
  margin-top: 12px;
}
</style>
