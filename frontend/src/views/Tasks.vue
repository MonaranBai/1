<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog, showToast } from 'vant'
import { useAuthStore } from '../store/auth'
import { useTasksStore } from '../store/tasks'
import { tasksApi } from '../api/tasksApi'

const router = useRouter()
const authStore = useAuthStore()
const tasksStore = useTasksStore()

const sortType = ref('time')
const showPublish = ref(false)
const viewMode = ref('list')

const publishForm = ref({
  title: '',
  description: '',
  location: '',
  reward: 0,
  deadline: '',
  tags: '',
  images: []
})

const onReadTaskImages = (file) => {
  const files = Array.isArray(file) ? file : [file]
  const list = files.map((item) => item.content).filter(Boolean)
  publishForm.value.images = [...publishForm.value.images, ...list].slice(0, 4)
}

const onDeleteTaskImage = (file) => {
  publishForm.value.images = publishForm.value.images.filter((item) => item !== file.url)
}

const list = computed(() => {
  let arr = tasksStore.sortedTasks
  if (sortType.value === 'reward') {
    arr = [...arr].sort((a, b) => Number(b.reward || 0) - Number(a.reward || 0))
  }
  if (sortType.value === 'distance') {
    arr = [...arr].sort((a, b) => a.location.localeCompare(b.location))
  }
  return arr
})

const statusTextMap = {
  pending: '待接单',
  ongoing: '进行中',
  pending_confirm: '待确认',
  completed: '已完成',
  cancelled: '已取消'
}

const statusTypeMap = {
  pending: 'primary',
  ongoing: 'warning',
  pending_confirm: 'warning',
  completed: 'success',
  cancelled: 'danger'
}

const canOperate = computed(() => authStore.isLoggedIn && !authStore.isCurrentUserRestricted)

const applyTask = (task) => {
  if (!authStore.isLoggedIn) {
    showToast('请先登录后接单')
    return
  }
  if (authStore.isCurrentUserRestricted) {
    showToast('信用分低于60，暂不可接单')
    return
  }
  tasksApi.apply(task.id, { helperId: authStore.user.id })
  const ok = tasksStore.applyTask(task.id, authStore.user.id, authStore.user.nickname)
  if (!ok) {
    showToast('任务当前不可接单')
    return
  }
  tasksStore.addBehavior(authStore.user.id, 'task', task.id, 'apply', task.tags || [])
  showToast('接单成功，任务进入进行中')
}

const publishTask = () => {
  if (!authStore.isLoggedIn) {
    showToast('请先登录')
    return
  }
  if (authStore.isCurrentUserRestricted) {
    showToast('信用分低于60，暂不可发布任务')
    return
  }
  if (!publishForm.value.title || !publishForm.value.location) {
    showToast('请填写任务标题和地点')
    return
  }

  const tags = publishForm.value.tags
    .split('、')
    .map((item) => item.trim())
    .filter(Boolean)

  tasksApi.create(publishForm.value)
  tasksStore.addTask({
    title: publishForm.value.title,
    description: publishForm.value.description,
    location: publishForm.value.location,
    reward: Number(publishForm.value.reward || 0),
    deadline: publishForm.value.deadline,
    status: 'pending',
    publisherId: authStore.user.id,
    publisher: authStore.user.nickname,
    tags,
    images: publishForm.value.images
  })

  showPublish.value = false
  publishForm.value = { title: '', description: '', location: '', reward: 0, deadline: '', tags: '', images: [] }
  showToast('任务发布成功')
}

const confirmComplete = async (task) => {
  await showConfirmDialog({ title: '确认完成', message: '确认将任务标记为已完成？' })
  await tasksApi.updateStatus(task.id, { status: 'completed' })
  tasksStore.confirmTaskComplete(task.id)
  showToast('任务已完成，进入评价阶段')
}

const markPendingConfirm = (task) => {
  tasksApi.updateStatus(task.id, { status: 'pending_confirm' })
  const ok = tasksStore.markTaskPendingConfirm(task.id)
  if (ok) showToast('任务已提交待确认')
}

const evaluate = (task, rating) => {
  if (!authStore.isLoggedIn || !task.helperId) return
  tasksApi.evaluate(task.id, { rating, toUserId: task.helperId })
  const change = tasksStore.evaluateTask(task.id, authStore.user.id, task.helperId, rating, '演示评价')
  showToast(`评价完成，信用分变动 ${change >= 0 ? '+' : ''}${change}`)
}

const toTaskDetail = (id) => {
  router.push(`/tasks/${id}`)
}
</script>

<template>
  <div class="page">
    <van-nav-bar title="互助任务" right-text="发布" @click-right="showPublish = true" />

    <div class="ops-row">
      <van-dropdown-menu>
        <van-dropdown-item v-model="sortType" :options="[
          { text: '按时间排序', value: 'time' },
          { text: '按报酬排序', value: 'reward' },
          { text: '按距离(演示)', value: 'distance' }
        ]" />
      </van-dropdown-menu>
    </div>

    <div class="mode-switch">
      <van-tag :type="viewMode === 'list' ? 'primary' : 'default'" round @click="viewMode = 'list'">列表模式</van-tag>
      <van-tag :type="viewMode === 'map' ? 'primary' : 'default'" round @click="viewMode = 'map'">地图模式</van-tag>
    </div>

    <div class="credit-tip" v-if="authStore.isLoggedIn">
      当前信用分：{{ authStore.currentUserCredit }}
      <span v-if="authStore.isCurrentUserRestricted">（低于60，已限制发布/接单）</span>
    </div>

    <div v-if="viewMode === 'map'" class="map-wrap">
      <div class="map-panel">地图模式（高德API预留）：后续接入定位与附近任务点位展示</div>
      <van-cell-group inset class="task-card" v-for="item in list" :key="`map-${item.id}`">
        <van-cell :title="item.title" :label="`${item.location} · ${item.reward}积分`" is-link @click="toTaskDetail(item.id)">
          <template #icon>
            <van-image v-if="item.images?.length" :src="item.images[0]" width="42" height="42" radius="6" fit="cover" />
          </template>
        </van-cell>
      </van-cell-group>
    </div>

    <van-cell-group v-else inset class="task-card" v-for="item in list" :key="item.id">
      <van-cell :title="item.title" :label="`地点：${item.location} | 截止：${item.deadline || '未填'}`">
        <template #value>
          <van-tag :type="statusTypeMap[item.status] || 'default'">{{ statusTextMap[item.status] || item.status }}</van-tag>
        </template>
      </van-cell>
      <van-image v-if="item.images?.length" class="task-thumb" :src="item.images[0]" fit="cover" radius="8" />
      <div class="task-desc">{{ item.description }}</div>
      <div class="task-meta">
        <span>发布者：{{ item.publisher }}</span>
        <span>报酬：{{ item.reward }}积分</span>
      </div>
      <div class="task-actions">
        <van-button size="small" plain type="default" @click="toTaskDetail(item.id)">详情</van-button>
        <van-button v-if="item.status === 'pending'" size="small" type="primary" plain @click="applyTask(item)">我要接单</van-button>
        <van-button v-if="item.status === 'ongoing' && item.publisherId === authStore.user.id" size="small" type="warning" plain @click="markPendingConfirm(item)">提交待确认</van-button>
        <van-button v-if="item.status === 'pending_confirm' && item.publisherId === authStore.user.id" size="small" type="success" plain @click="confirmComplete(item)">确认完成</van-button>
        <van-button v-if="item.status === 'completed' && item.publisherId === authStore.user.id" size="small" type="success" plain @click="evaluate(item, 'good')">好评(+2)</van-button>
        <van-button v-if="item.status === 'completed' && item.publisherId === authStore.user.id" size="small" type="default" plain @click="evaluate(item, 'neutral')">中评(0)</van-button>
        <van-button v-if="item.status === 'completed' && item.publisherId === authStore.user.id" size="small" type="danger" plain @click="evaluate(item, 'bad')">差评(-2)</van-button>
      </div>
    </van-cell-group>

    <van-popup v-model:show="showPublish" round position="bottom" :style="{ padding: '16px' }">
      <h3 style="margin: 0 0 10px;">发布互助任务</h3>
      <van-field v-model="publishForm.title" label="标题" placeholder="如：代取快递" />
      <van-field v-model="publishForm.description" label="描述" placeholder="任务说明" type="textarea" rows="2" />
      <van-field v-model="publishForm.location" label="地点" placeholder="如：南门驿站" />
      <van-field v-model="publishForm.reward" label="报酬" type="digit" placeholder="积分数" />
      <van-field v-model="publishForm.deadline" label="截止时间" placeholder="2026-03-20 18:00" />
      <van-field v-model="publishForm.tags" label="标签" placeholder="用、分隔，如：快递、跑腿" />
      <van-cell title="任务图片" label="可选，建议上传任务现场图">
        <template #value>
          <van-uploader
            :model-value="publishForm.images.map((item) => ({ url: item }))"
            :max-count="4"
            multiple
            :after-read="onReadTaskImages"
            :after-delete="onDeleteTaskImage"
          />
        </template>
      </van-cell>
      <div class="task-actions" style="padding: 12px 0 0;">
        <van-button block type="primary" :disabled="!canOperate" @click="publishTask">发布任务</van-button>
      </div>
    </van-popup>
  </div>
</template>

<style scoped>
.ops-row {
  margin-top: -6px;
}

.mode-switch {
  display: flex;
  gap: 8px;
  padding: 10px 12px 0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.mode-switch::-webkit-scrollbar {
  display: none;
}

.map-wrap {
  padding-top: 10px;
}

.map-panel {
  margin: 0 12px 10px;
  border-radius: 10px;
  padding: 14px;
  background: #eef6ff;
  color: #1989fa;
  font-size: 13px;
}

.credit-tip {
  margin: 10px 12px;
  padding: 8px 10px;
  border-radius: 8px;
  background: #fff7e8;
  color: #ed6a0c;
  font-size: 12px;
}

.task-card {
  margin-top: 10px;
  transition: transform 0.18s ease;
}

.task-card:active {
  transform: scale(0.995);
}

.task-desc {
  padding: 0 16px;
  color: #646566;
}

.task-thumb {
  margin: 8px 16px;
  width: calc(100% - 32px);
  height: 130px;
  border-radius: 8px;
}

.task-meta {
  padding: 8px 16px;
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #969799;
}

.task-actions {
  padding: 0 16px 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
