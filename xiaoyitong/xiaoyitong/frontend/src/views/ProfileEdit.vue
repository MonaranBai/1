<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useAuthStore } from '../store/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({
  nickname: authStore.user.nickname,
  phone: authStore.user.phone,
  studentId: authStore.user.studentId,
  campus: authStore.user.campus,
  wechat: authStore.user.wechat,
  qq: authStore.user.qq,
  avatar: authStore.user.avatar
})

const canEdit = computed(() => authStore.isLoggedIn)

const afterReadAvatar = (file) => {
  form.value.avatar = file.content || form.value.avatar
}

const saveProfile = () => {
  if (!canEdit.value) {
    showToast('请先登录')
    router.replace('/auth')
    return
  }
  if (!form.value.nickname || form.value.phone.length !== 11) {
    showToast('请填写正确昵称和手机号')
    return
  }
  authStore.updateProfile(form.value)
  showToast('资料已保存（演示）')
  router.back()
}
</script>

<template>
  <div class="page">
    <van-nav-bar title="编辑个人资料" left-arrow @click-left="$router.back()" />

    <van-empty v-if="!canEdit" description="请先登录后编辑资料" />

    <van-form v-else @submit="saveProfile" class="form-wrap">
      <div class="avatar-wrap">
        <van-image round width="72" height="72" :src="form.avatar" />
        <van-uploader :max-count="1" :after-read="afterReadAvatar">
          <van-button size="small" plain type="primary">更换头像</van-button>
        </van-uploader>
      </div>

      <van-field v-model="form.nickname" label="昵称" placeholder="请输入昵称" />
      <van-field v-model="form.phone" label="手机号" type="tel" placeholder="请输入手机号" />
      <van-field v-model="form.studentId" label="学号" placeholder="请输入学号" />
      <van-field v-model="form.campus" label="所在校区" placeholder="如：主校区" />
      <van-field v-model="form.wechat" label="微信" placeholder="请输入微信号" />
      <van-field v-model="form.qq" label="QQ" placeholder="请输入QQ号" />

      <div class="submit-wrap">
        <van-button block round type="primary" native-type="submit">保存资料</van-button>
      </div>
    </van-form>
  </div>
</template>

<style scoped>
.form-wrap {
  margin-top: 14px;
}

.avatar-wrap {
  margin: 16px;
  padding: 14px;
  border-radius: 12px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.submit-wrap {
  margin: 20px 16px;
}
</style>
