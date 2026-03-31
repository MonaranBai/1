<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePostsStore } from '../store/posts'
import { useAuthStore } from '../store/auth'
import { useTasksStore } from '../store/tasks'

const router = useRouter()
const postsStore = usePostsStore()
const authStore = useAuthStore()
const tasksStore = useTasksStore()

const activeCategory = ref('全部')
const keyword = ref('')
const sortType = ref('time')
const sortOrder = ref('desc')
const categories = ['全部', '二手', '拼车', '租房', '组队']

const displayList = computed(() => {
  let list = postsStore.sortedPosts
  if (activeCategory.value !== '全部') {
    list = list.filter((item) => item.category === activeCategory.value)
  }
  if (keyword.value.trim()) {
    const query = keyword.value.trim()
    list = list.filter((item) => {
      const jointText = [
        item.title,
        item.description,
        item.destination,
        item.location,
        item.activityLocation
      ]
        .filter(Boolean)
        .join(' ')
      return jointText.includes(query)
    })
  }
  if (sortType.value === 'price') {
    list = [...list].sort((a, b) => {
      const result = Number(a.price || a.fee || 0) - Number(b.price || b.fee || 0)
      return sortOrder.value === 'asc' ? result : -result
    })
  } else {
    list = [...list].sort((a, b) => {
      const result = Number(a.id || 0) - Number(b.id || 0)
      return sortOrder.value === 'asc' ? result : -result
    })
  }
  return list
})

const formatPrice = (item) => {
  if (item.category === '拼车') return `￥${item.fee || 0}`
  if (item.category === '组队') return '面议'
  return `￥${item.price || 0}`
}

const recommendedTasks = computed(() => {
  const uid = authStore.user?.id
  return tasksStore.recommendTasksForUser(uid).slice(0, 2)
})

const jumpDetail = (id) => {
  if (authStore.user?.id) {
    const post = postsStore.getById(id)
    if (post) {
      const tags = [post.category, post.title].filter(Boolean)
      tasksStore.addBehavior(authStore.user.id, 'post', id, 'view', tags)
    }
  }
  router.push(`/detail/${id}`)
}

const jumpTasks = (taskId) => {
  if (!taskId) {
    router.push('/tasks')
    return
  }
  router.push(`/tasks/${taskId}`)
}
</script>

<template>
  <div class="page">
    <van-nav-bar title="校易通" />
    <van-search v-model="keyword" shape="round" placeholder="搜索标题 / 描述 / 目的地" />

    <div class="quick-grid soft-card">
      <div class="quick-item" @click="router.push('/publish')">
        <van-icon name="add-square" size="20" />
        <span>快速发布</span>
      </div>
      <div class="quick-item" @click="router.push('/tasks')">
        <van-icon name="todo-list-o" size="20" />
        <span>互助任务</span>
      </div>
      <div class="quick-item" @click="router.push('/buddies')">
        <van-icon name="friends-o" size="20" />
        <span>搭子圈</span>
      </div>
      <div class="quick-item" @click="router.push('/profile')">
        <van-icon name="user-o" size="20" />
        <span>个人中心</span>
      </div>
      <div class="quick-item" @click="router.push('/auth')">
        <van-icon name="contact" size="20" />
        <span>登录入口</span>
      </div>
    </div>

    <div class="toolbar">
      <van-dropdown-menu>
        <van-dropdown-item v-model="sortType" :options="[
          { text: '按时间排序', value: 'time' },
          { text: '按价格排序', value: 'price' }
        ]" />
      </van-dropdown-menu>
      <div class="order-switch">
        <van-tag round :type="sortOrder === 'desc' ? 'primary' : 'default'" @click="sortOrder = 'desc'">降序</van-tag>
        <van-tag round :type="sortOrder === 'asc' ? 'primary' : 'default'" @click="sortOrder = 'asc'">升序</van-tag>
      </div>
    </div>

    <div class="category-scroll">
      <van-tag
        v-for="item in categories"
        :key="item"
        :type="activeCategory === item ? 'primary' : 'default'"
        round
        size="large"
        class="category-tag"
        @click="activeCategory = item"
      >
        {{ item }}
      </van-tag>
    </div>

    <div class="feed">
      <van-cell-group inset class="recommend-wrap">
        <van-cell title="智能推荐任务" value="查看全部" is-link @click="jumpTasks" />
        <div v-if="recommendedTasks.length" class="recommend-list">
          <div class="recommend-item" v-for="task in recommendedTasks" :key="task.id" @click="jumpTasks(task.id)">
            <div class="recommend-title">{{ task.title }}</div>
            <div class="recommend-meta">{{ task.location }} · {{ task.reward }}积分</div>
          </div>
        </div>
        <van-empty v-else image-size="66" description="暂无推荐，先浏览一些内容吧" />
      </van-cell-group>

      <van-empty v-if="!displayList.length" description="暂无匹配信息" />
      <div v-for="item in displayList" :key="item.id" class="post-card-wrap" @click="jumpDetail(item.id)">
        <van-cell-group inset class="post-card">
          <van-cell clickable>
            <template #title>
              <div class="post-title-row">
                <span class="post-title">{{ item.title }}</span>
                <van-tag plain type="primary">{{ item.category }}</van-tag>
              </div>
              <div class="post-price">{{ formatPrice(item) }}</div>
            </template>
            <template #label>
              <van-image
                v-if="['二手', '租房'].includes(item.category) && item.images?.length"
                class="post-thumb"
                :src="item.images[0]"
                fit="cover"
                radius="8"
              />
              <div class="post-desc">{{ item.description }}</div>
              <div class="post-meta-line">
                <span>发布者：{{ item.publisher || '匿名同学' }}</span>
                <span>发布时间：{{ item.createdAt }}</span>
              </div>
              <div class="post-hint">登录后可见联系方式 · 点击查看详情</div>
            </template>
          </van-cell>
        </van-cell-group>
      </div>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  margin-top: -6px;
}

.order-switch {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 8px 12px 0;
}

.category-scroll {
  padding: 10px 12px;
  display: flex;
  gap: 8px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  touch-action: pan-x;
}

.category-scroll::-webkit-scrollbar {
  display: none;
}

.category-tag {
  flex-shrink: 0;
}

.feed {
  padding: 2px 0 8px;
}

.quick-grid {
  margin: 10px 12px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 10px;
}

.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: #646566;
  font-size: 12px;
  transition: transform 0.18s ease;
}

.quick-item:active {
  transform: scale(0.97);
}

.recommend-wrap {
  margin-bottom: 10px;
}

.recommend-list {
  padding: 0 16px 12px;
}

.recommend-item {
  background: #f7f8fa;
  border-radius: 8px;
  padding: 10px;
  margin-top: 8px;
  transition: transform 0.18s ease;
}

.recommend-item:active {
  transform: scale(0.99);
}

.recommend-title {
  font-size: 14px;
  font-weight: 600;
}

.recommend-meta {
  margin-top: 4px;
  font-size: 12px;
  color: #969799;
}

.post-card {
  margin-bottom: 10px;
}

.post-card-wrap {
  cursor: pointer;
  transition: transform 0.18s ease;
}

.post-card-wrap:active {
  transform: scale(0.995);
}

.post-title-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
}

.post-title {
  font-size: 15px;
  font-weight: 600;
}

.post-price {
  color: #ee0a24;
  font-weight: 600;
  margin-top: 4px;
}

.post-desc {
  color: #646566;
  margin-bottom: 4px;
}

.post-thumb {
  width: 100%;
  height: 132px;
  margin-bottom: 8px;
}

.post-meta-line {
  margin-top: 4px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 12px;
  color: #969799;
}

.post-hint {
  margin-top: 6px;
  padding: 4px 8px;
  background: #fff7e8;
  border-radius: 6px;
  color: #ed6a0c;
  font-size: 12px;
}
</style>
