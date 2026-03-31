<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showConfirmDialog, showImagePreview, showToast } from 'vant'
import { useAuthStore } from '../store/auth'
import { useTasksStore } from '../store/tasks'
import { tasksApi } from '../api/tasksApi'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const tasksStore = useTasksStore()

const task = computed(() => tasksStore.getTaskById(route.params.id))
const taskImages = computed(() => task.value?.images || [])

const statusTextMap = {
  pending: '待接单',
  ongoing: '进行中',
  pending_confirm: '待确认',
  completed: '已完成',
  cancelled: '已取消'
}

const applyTask = async () => {
  if (!task.value) return
  if (!authStore.isLoggedIn) {
    showToast('请先登录后接单')
    return
  }
  if (authStore.isCurrentUserRestricted) {
    showToast('信用分低于60，暂不可接单')
    return
  }
  await tasksApi.apply(task.value.id, { helperId: authStore.user.id })
  const ok = tasksStore.applyTask(task.value.id, authStore.user.id, authStore.user.nickname)
  if (!ok) {
    showToast('任务不可接单')
    return
  }
  showToast('接单成功')
}

const submitPendingConfirm = async () => {
  if (!task.value) return
  await tasksApi.updateStatus(task.value.id, { status: 'pending_confirm' })
  const ok = tasksStore.markTaskPendingConfirm(task.value.id)
  if (ok) showToast('已提交待确认')
}

const confirmComplete = async () => {
  if (!task.value) return
  await showConfirmDialog({ title: '确认完成', message: '确认任务已完成？' })
  await tasksApi.updateStatus(task.value.id, { status: 'completed' })
  const ok = tasksStore.confirmTaskComplete(task.value.id)
  if (ok) showToast('任务已完成')
}

const previewTaskImages = (index) => {
  if (!taskImages.value.length) return
  showImagePreview({
    images: taskImages.value,
    startPosition: index,
    closeable: true
  })
}
</script>

<template>
  <div class="page">
    <van-nav-bar title="任务详情" left-arrow @click-left="router.back()" />

    <van-empty v-if="!task" description="任务不存在或已删除" />

    <van-cell-group v-else inset class="task-card">
      <van-cell :title="task.title" :label="task.description">
        <template #value>
          <van-tag type="primary">{{ statusTextMap[task.status] || task.status }}</van-tag>
        </template>
      </van-cell>
      <van-cell title="发布者" :value="task.publisher" />
      <van-cell title="地点" :value="task.location" />
      <van-cell title="报酬" :value="`${task.reward}积分`" />
      <van-cell title="截止时间" :value="task.deadline || '未填写'" />
      <van-cell title="接单人" :value="task.helperName || '暂无'" />
      <van-cell title="标签" :value="(task.tags || []).join('、') || '无'" />
      <div class="image-grid" v-if="taskImages.length">
        <van-image
          v-for="(img, index) in taskImages"
          :key="`${img}-${index}`"
          :src="img"
          fit="cover"
          radius="8"
          class="task-image"
          @click="previewTaskImages(index)"
        />
      </div>

      <div class="actions">
        <van-button v-if="task.status === 'pending'" size="small" plain type="primary" @click="applyTask">我要接单</van-button>
        <van-button v-if="task.status === 'ongoing' && task.publisherId === authStore.user.id" size="small" plain type="warning" @click="submitPendingConfirm">提交待确认</van-button>
        <van-button v-if="task.status === 'pending_confirm' && task.publisherId === authStore.user.id" size="small" plain type="success" @click="confirmComplete">确认完成</van-button>
      </div>
    </van-cell-group>
  </div>
</template>

<style scoped>
.task-card {
  margin-top: 12px;
}

.actions {
  padding: 0 16px 14px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.image-grid {
  padding: 10px 16px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.task-image {
  width: 100%;
  height: 120px;
}
</style>
