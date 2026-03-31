<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showConfirmDialog, showImagePreview, showToast } from 'vant'
import { usePostsStore } from '../store/posts'
import { useAuthStore } from '../store/auth'
import { postsApi } from '../api/postsApi'

const route = useRoute()
const router = useRouter()
const postsStore = usePostsStore()
const authStore = useAuthStore()

const reason = ref('')
const showReport = ref(false)

const post = computed(() => postsStore.getById(route.params.id))
const contactDisplay = computed(() => {
  if (!post.value) return '-'
  return `${post.value.contactType}：${post.value.contactInfo}`
})

const categoryFields = computed(() => {
  if (!post.value) return []
  if (post.value.category === '二手') {
    return [
      { label: '价格', value: `￥${post.value.price || 0}` },
      { label: '校区', value: post.value.campus || '未填写' }
    ]
  }
  if (post.value.category === '拼车') {
    return [
      { label: '出发地', value: post.value.start || '未填写' },
      { label: '目的地', value: post.value.destination || '未填写' },
      { label: '出发时间', value: post.value.departTime || '未填写' },
      { label: '人数', value: `${post.value.seats || 0}人` },
      { label: '费用', value: `￥${post.value.fee || 0}` }
    ]
  }
  if (post.value.category === '租房') {
    return [
      { label: '位置', value: post.value.location || '未填写' },
      { label: '户型', value: post.value.houseType || '未填写' },
      { label: '租期', value: post.value.rentTerm || '未填写' },
      { label: '价格', value: `￥${post.value.price || 0}/月` }
    ]
  }
  return [
    { label: '活动类型', value: post.value.activityType || '未填写' },
    { label: '活动时间', value: post.value.activityTime || '未填写' },
    { label: '活动地点', value: post.value.activityLocation || '未填写' },
    { label: '人数需求', value: `${post.value.members || 0}人` }
  ]
})

const postImages = computed(() => {
  if (!post.value) return []
  if (!['二手', '租房'].includes(post.value.category)) return []
  return post.value.images || []
})

const previewImages = (index) => {
  if (!postImages.value.length) return
  showImagePreview({
    images: postImages.value,
    startPosition: index,
    closeable: true
  })
}

const copyContact = async () => {
  if (!authStore.isLoggedIn) {
    showToast('请先登录后查看联系方式')
    router.push('/auth')
    return
  }
  await navigator.clipboard.writeText(contactDisplay.value)
  showToast('联系方式已复制')
}

const openReport = () => {
  showReport.value = true
}

const submitReport = () => {
  if (!reason.value.trim()) {
    showToast('请填写举报原因')
    return
  }
  postsStore.reportPost(
    Number(route.params.id),
    reason.value.trim(),
    authStore.isLoggedIn ? authStore.user.nickname : '游客'
  )
  postsApi.report({
    postId: Number(route.params.id),
    reason: reason.value.trim(),
    reporter: authStore.isLoggedIn ? authStore.user.nickname : '游客'
  })
  reason.value = ''
  showReport.value = false
  showToast('举报已提交（演示数据）')
}

const confirmDelete = async () => {
  await showConfirmDialog({ title: '删除确认', message: '是否删除这条信息？仅用于演示。' })
  postsStore.removePost(Number(route.params.id))
  showToast('已删除')
  router.push('/my-posts')
}

const goAuth = () => {
  router.push('/auth')
}
</script>

<template>
  <div class="page">
    <van-nav-bar title="资源详情" left-arrow @click-left="$router.back()" />
    <van-empty v-if="!post" description="内容不存在或已删除" />

    <template v-else>
      <div class="banner">
        <van-tag plain type="primary">{{ post.category }}</van-tag>
        <h2 class="title">{{ post.title }}</h2>
        <p class="desc">{{ post.description }}</p>
      </div>

      <van-cell-group v-if="postImages.length" inset class="detail-card">
        <div class="image-grid">
          <van-image
            v-for="(img, index) in postImages"
            :key="`${img}-${index}`"
            :src="img"
            fit="cover"
            radius="8"
            class="goods-image"
            @click="previewImages(index)"
          />
        </div>
      </van-cell-group>

      <van-cell-group inset class="detail-card">
        <van-cell title="发布者" :value="post.publisher || '匿名同学'" />
        <van-cell title="发布时间" :value="post.createdAt" />
        <van-cell v-for="field in categoryFields" :key="field.label" :title="field.label" :value="field.value" />
      </van-cell-group>

      <van-cell-group inset class="detail-card">
        <van-cell title="联系方式" :value="authStore.isLoggedIn ? contactDisplay : '登录后可见'" />
        <div class="btn-row">
          <van-button type="primary" plain size="small" @click="copyContact">一键复制联系方式</van-button>
          <van-button v-if="!authStore.isLoggedIn" type="default" plain size="small" @click="goAuth">去登录</van-button>
          <van-button type="danger" plain size="small" @click="confirmDelete">删除（演示）</van-button>
        </div>
      </van-cell-group>

      <van-cell-group inset class="detail-card">
        <div class="btn-row">
          <van-button block type="warning" plain @click="openReport">举报该信息</van-button>
        </div>
      </van-cell-group>

      <van-popup v-model:show="showReport" round position="bottom" :style="{ padding: '16px' }">
        <h3 style="margin: 0 0 12px;">举报信息</h3>
        <van-field
          v-model="reason"
          rows="3"
          autosize
          type="textarea"
          maxlength="100"
          placeholder="请填写举报原因（如：虚假信息/联系方式无效）"
          show-word-limit
        />
        <div class="btn-row" style="padding: 12px 0 0;">
          <van-button block type="warning" @click="submitReport">提交举报</van-button>
        </div>
      </van-popup>
    </template>
  </div>
</template>

<style scoped>
.banner {
  margin: 12px;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
}

.title {
  margin: 10px 0 6px;
  font-size: 19px;
}

.desc {
  margin: 0;
  font-size: 14px;
  color: #646566;
  line-height: 1.6;
}

.detail-card {
  margin-top: 12px;
}

.image-grid {
  padding: 12px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.goods-image {
  width: 100%;
  height: 140px;
}

.btn-row {
  display: flex;
  gap: 8px;
  padding: 12px 16px 16px;
}
</style>