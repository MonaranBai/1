<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { showDialog, showToast } from 'vant'
import { useAuthStore } from '../store/auth'
import { usePostsStore } from '../store/posts'

const router = useRouter()
const authStore = useAuthStore()
const postsStore = usePostsStore()

const myPosts = computed(() => {
  if (!authStore.isLoggedIn) return []
  return postsStore.sortedPosts.filter((item) => postsStore.myPostIds.includes(item.id))
})

const remove = async (id) => {
  await showDialog({ title: '提示', message: '确认删除该内容吗？' })
  postsStore.removePost(id)
  showToast('删除成功')
}

const toDetail = (id) => {
  router.push(`/detail/${id}`)
}
</script>

<template>
  <div class="page">
    <van-nav-bar title="我的发布" left-arrow @click-left="$router.back()" />
    <van-empty v-if="!authStore.isLoggedIn" description="请先登录后查看" />
    <van-empty v-else-if="!myPosts.length" description="你还没有发布内容" />

    <van-cell-group v-else v-for="item in myPosts" :key="item.id" inset class="card">
      <template #title>
        <div class="title-row">
          <span>{{ item.title }}</span>
          <van-tag type="primary" plain>{{ item.category }}</van-tag>
        </div>
      </template>
      <template #label>
        <div class="desc">{{ item.description }}</div>
        <div class="time">{{ item.createdAt }}</div>
        <div class="actions">
          <van-button size="small" plain type="primary" @click="toDetail(item.id)">查看详情</van-button>
          <van-button size="small" plain type="danger" @click="remove(item.id)">删除</van-button>
        </div>
      </template>
    </van-cell-group>
  </div>
</template>

<style scoped>
.card {
  margin-top: 10px;
}

.title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.desc {
  margin-top: 4px;
}

.time {
  font-size: 12px;
  color: #969799;
  margin: 6px 0;
}

.actions {
  display: flex;
  gap: 8px;
}
</style>