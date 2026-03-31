<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const showUserTabbar = computed(() => !route.path.startsWith('/admin'))
const activeTab = computed(() => {
  if (route.path.startsWith('/tasks')) return 1
  if (route.path.startsWith('/buddies')) return 2
  if (route.path.startsWith('/publish')) return 3
  if (route.path.startsWith('/profile') || route.path.startsWith('/my-posts') || route.path.startsWith('/verification')) return 4
  return 0
})
</script>

<template>
  <div class="app-container">
    <router-view />
    <van-tabbar v-if="showUserTabbar" :model-value="activeTab" route fixed placeholder safe-area-inset-bottom class="main-tabbar">
      <van-tabbar-item replace to="/" icon="home-o">首页</van-tabbar-item>
      <van-tabbar-item replace to="/tasks" icon="todo-list-o">任务</van-tabbar-item>
      <van-tabbar-item replace to="/buddies" icon="friends-o">搭子圈</van-tabbar-item>
      <van-tabbar-item replace to="/publish" icon="add-o">发布</van-tabbar-item>
      <van-tabbar-item replace to="/profile" icon="user-o">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100dvh;
  width: 100%;
  padding-bottom: calc(var(--van-tabbar-height) + env(safe-area-inset-bottom));
}

:deep(.main-tabbar) {
  position: fixed;
  inset-inline: 0;
  width: 100%;
  bottom: 0;
  z-index: 999;
  border-top: 1px solid #f0f0f0;
}
</style>
