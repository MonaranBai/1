<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useAuthStore } from '../store/auth'

const router = useRouter()
const authStore = useAuthStore()
const uploadedImage = ref(authStore.user.studentCardImage)

const statusText = computed(() => {
  if (authStore.user.verificationStatus === 'verified') return '已认证'
  if (authStore.user.verificationStatus === 'pending') return '审核中'
  return '未认证'
})

const statusType = computed(() => {
  if (authStore.user.verificationStatus === 'verified') return 'success'
  if (authStore.user.verificationStatus === 'pending') return 'warning'
  return 'default'
})

const afterReadCard = (file) => {
  uploadedImage.value = file.content || ''
}

const submitVerification = () => {
  if (!authStore.isLoggedIn) {
    showToast('请先登录')
    router.replace('/auth')
    return
  }
  if (!uploadedImage.value) {
    showToast('请先上传学生证图片')
    return
  }
  authStore.submitStudentVerification(uploadedImage.value)
  showToast('认证申请已提交，当前状态：审核中')
}

const quickApprove = () => {
  authStore.approveStudentVerification()
  showToast('模拟审核通过，已显示认证标识')
}
</script>

<template>
  <div class="page">
    <van-nav-bar title="学生认证" left-arrow @click-left="$router.back()" />

    <van-cell-group inset class="card">
      <van-cell title="当前认证状态">
        <template #value>
          <van-tag :type="statusType">{{ statusText }}</van-tag>
        </template>
      </van-cell>
      <van-cell title="说明" label="演示阶段：上传学生证后可通过“模拟审核通过”按钮快速通过审核。" />
    </van-cell-group>

    <div class="upload-wrap">
      <van-uploader :max-count="1" :after-read="afterReadCard">
        <van-button type="primary" plain>上传学生证图片</van-button>
      </van-uploader>
      <van-image v-if="uploadedImage" :src="uploadedImage" width="100%" height="180" fit="cover" radius="8" class="preview" />
    </div>

    <div class="actions">
      <van-button block type="primary" @click="submitVerification">提交认证申请</van-button>
      <van-button block plain type="success" style="margin-top: 10px" @click="quickApprove">模拟审核通过</van-button>
    </div>
  </div>
</template>

<style scoped>
.card {
  margin-top: 12px;
}

.upload-wrap {
  margin: 12px;
  padding: 14px;
  background: #fff;
  border-radius: 12px;
}

.preview {
  margin-top: 12px;
}

.actions {
  margin: 16px 12px;
}
</style>
