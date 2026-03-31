<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useAuthStore } from '../store/auth'
import { authApi } from '../api/authApi'

const router = useRouter()
const authStore = useAuthStore()

const active = ref(0)

const loginForm = ref({
  phone: '',
  code: ''
})

const registerForm = ref({
  nickname: '',
  phone: '',
  studentId: '',
  wechat: '',
  qq: '',
  campus: '主校区'
})

const adminForm = ref({
  account: 'admin',
  password: 'admin123'
})

const onLogin = () => {
  if (loginForm.value.phone.length !== 11) {
    showToast('请输入11位手机号')
    return
  }
  authApi.login(loginForm.value)
  const ok = authStore.login(loginForm.value.phone)
  if (!ok) {
    showToast('该账号已被管理员禁用')
    return
  }
  showToast('登录成功（演示）')
  router.replace('/profile')
}

const onRegister = () => {
  const payload = registerForm.value
  if (!payload.nickname || payload.phone.length !== 11) {
    showToast('请填写昵称和正确手机号')
    return
  }
  authApi.register(payload)
  const ok = authStore.register(payload)
  if (!ok) {
    showToast('注册失败，请稍后重试')
    return
  }
  showToast('注册并登录成功（演示）')
  router.replace('/profile')
}

const onAdminLogin = () => {
  authApi.adminLogin(adminForm.value)
  const ok = authStore.adminLogin(adminForm.value.account, adminForm.value.password)
  if (!ok) {
    showToast('管理员账号或密码错误')
    return
  }
  showToast('管理员登录成功')
  router.replace('/admin')
}
</script>

<template>
  <div class="page">
    <van-nav-bar title="登录 / 注册" left-arrow @click-left="$router.back()" />

    <van-tabs v-model:active="active" sticky>
      <van-tab title="登录">
        <van-form @submit="onLogin" class="auth-form">
          <van-field v-model="loginForm.phone" label="手机号" placeholder="请输入手机号" type="tel" />
          <van-field v-model="loginForm.code" label="验证码" placeholder="输入任意4位即可">
            <template #button>
              <van-button size="small" type="primary">发送验证码</van-button>
            </template>
          </van-field>
          <div class="submit-wrap">
            <van-button block round type="primary" native-type="submit">立即登录</van-button>
          </div>
        </van-form>
      </van-tab>

      <van-tab title="注册">
        <van-form @submit="onRegister" class="auth-form">
          <van-field v-model="registerForm.nickname" label="昵称" placeholder="如：计科小王" />
          <van-field v-model="registerForm.phone" label="手机号" placeholder="请输入手机号" type="tel" />
          <van-field v-model="registerForm.studentId" label="学号" placeholder="演示用，可随意填写" />
          <van-field v-model="registerForm.wechat" label="微信" placeholder="可选" />
          <van-field v-model="registerForm.qq" label="QQ" placeholder="可选" />
          <van-field v-model="registerForm.campus" label="校区" placeholder="如：主校区" />
          <div class="submit-wrap">
            <van-button block round type="primary" native-type="submit">注册并进入</van-button>
          </div>
        </van-form>
      </van-tab>

      <van-tab title="管理员">
        <van-form @submit="onAdminLogin" class="auth-form">
          <van-field v-model="adminForm.account" label="账号" placeholder="请输入管理员账号" />
          <van-field v-model="adminForm.password" label="密码" type="password" placeholder="请输入管理员密码" />
          <van-cell title="演示账号" value="admin / admin123" />
          <div class="submit-wrap">
            <van-button block round type="warning" native-type="submit">管理员登录</van-button>
          </div>
        </van-form>
      </van-tab>
    </van-tabs>
  </div>
</template>

<style scoped>
.auth-form {
  margin-top: 16px;
}

.submit-wrap {
  margin: 20px 16px;
}
</style>
