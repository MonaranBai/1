<script setup>
import { computed, ref } from 'vue'
import { showToast } from 'vant'
import { useRouter } from 'vue-router'
import { usePostsStore } from '../store/posts'
import { useAuthStore } from '../store/auth'
import { useTasksStore } from '../store/tasks'
import { postsApi } from '../api/postsApi'

const router = useRouter()
const postsStore = usePostsStore()
const authStore = useAuthStore()
const tasksStore = useTasksStore()

const category = ref('二手')
const showPicker = ref(false)
const columns = [
  { text: '二手交易', value: '二手' },
  { text: '拼车出行', value: '拼车' },
  { text: '租房合租', value: '租房' },
  { text: '活动组队', value: '组队' }
]

const prohibitedWords = ['赌博', '刷单', '违法', '裸聊', '加我私聊返现']
const moderationBlocked = ref(false)

const aiRecommendCategory = () => {
  const text = `${form.value.title} ${form.value.desc}`
  if (!text.trim()) {
    showToast('请先输入标题或描述')
    return
  }
  const ruleMap = [
    { keys: ['快递', '代取', '跑腿', '帮忙'], target: '互助任务' },
    { keys: ['拼车', '顺风', '高铁', '机场'], target: '拼车' },
    { keys: ['租', '合租', '押金', '房'], target: '租房' },
    { keys: ['组队', '比赛', '项目', '招人'], target: '组队' },
    { keys: ['转让', '出售', '闲置', '二手'], target: '二手' }
  ]
  const matched = ruleMap.find((item) => item.keys.some((word) => text.includes(word)))
  const target = matched?.target || '二手'

  if (target === '互助任务') {
    showToast('AI推荐：互助任务，请前往任务中心发布')
    router.push('/tasks')
    return
  }
  category.value = target
  showToast(`AI推荐分类：${target}`)
}

const runModeration = () => {
  const text = `${form.value.title} ${form.value.desc} ${form.value.contact}`
  const hit = prohibitedWords.find((word) => text.includes(word))
  moderationBlocked.value = Boolean(hit)

  postsStore.addModerationLog({
    title: form.value.title || '(未填写标题)',
    result: hit ? 'blocked' : 'passed',
    reason: hit ? `命中敏感词：${hit}` : '内容正常',
    operator: authStore.isLoggedIn ? authStore.user.nickname : '游客'
  })

  if (hit) {
    showToast(`AI审核未通过：${hit}`)
  } else {
    showToast('AI审核通过')
  }
}

const form = ref({
  title: '',
  desc: '',
  price: '',
  campus: '',
  images: [],
  rentImages: [],
  start: '',
  end: '',
  departTime: '',
  seats: '',
  fee: '',
  location: '',
  houseType: '',
  rentTerm: '',
  activityType: '',
  activityTime: '',
  activityLocation: '',
  members: '',
  contactType: '微信',
  contact: ''
})

const categoryName = computed(() => {
  const target = columns.find((item) => item.value === category.value)
  return target ? target.text : category.value
})

const onConfirm = ({ selectedOptions }) => {
  category.value = selectedOptions[0].value
  showPicker.value = false
}

const resetForm = () => {
  form.value = {
    title: '',
    desc: '',
    price: '',
    campus: '',
    images: [],
    rentImages: [],
    start: '',
    end: '',
    departTime: '',
    seats: '',
    fee: '',
    location: '',
    houseType: '',
    rentTerm: '',
    activityType: '',
    activityTime: '',
    activityLocation: '',
    members: '',
    contactType: '微信',
    contact: ''
  }
}

const onReadImages = (file) => {
  const files = Array.isArray(file) ? file : [file]
  const list = files
    .map((item) => item.content)
    .filter(Boolean)

  form.value.images = [...form.value.images, ...list].slice(0, 6)
}

const onDeleteImage = (file) => {
  form.value.images = form.value.images.filter((item) => item !== file.url)
}

const onReadRentImages = (file) => {
  const files = Array.isArray(file) ? file : [file]
  const list = files.map((item) => item.content).filter(Boolean)
  form.value.rentImages = [...form.value.rentImages, ...list].slice(0, 6)
}

const onDeleteRentImage = (file) => {
  form.value.rentImages = form.value.rentImages.filter((item) => item !== file.url)
}

const onSubmit = () => {
  if (!form.value.title || !form.value.contact) {
    showToast('请至少填写标题和联系方式')
    return
  }

  if (moderationBlocked.value) {
    showToast('当前内容未通过审核，请修改后再发布')
    return
  }

  if (category.value === '二手' && !form.value.images.length) {
    showToast('二手交易请至少上传1张图片')
    return
  }

  const commonPayload = {
    category: category.value,
    title: form.value.title,
    description: form.value.desc,
    publisher: authStore.isLoggedIn ? authStore.user.nickname : '匿名同学',
    contactType: form.value.contactType,
    contactInfo: form.value.contact
  }

  let payload = { ...commonPayload }
  if (category.value === '二手') {
    payload = {
      ...payload,
      price: Number(form.value.price || 0),
      campus: form.value.campus,
      images: form.value.images
    }
  }
  if (category.value === '拼车') {
    payload = {
      ...payload,
      start: form.value.start,
      destination: form.value.end,
      departTime: form.value.departTime,
      seats: Number(form.value.seats || 0),
      fee: Number(form.value.fee || 0)
    }
  }
  if (category.value === '租房') {
    payload = {
      ...payload,
      location: form.value.location,
      houseType: form.value.houseType,
      rentTerm: form.value.rentTerm,
      price: Number(form.value.price || 0),
      images: form.value.rentImages
    }
  }
  if (category.value === '组队') {
    payload = {
      ...payload,
      activityType: form.value.activityType,
      activityTime: form.value.activityTime,
      activityLocation: form.value.activityLocation,
      members: Number(form.value.members || 0)
    }
  }

  const id = postsStore.addPost(payload)
  postsApi.create(payload)
  if (authStore.user?.id) {
    tasksStore.addBehavior(authStore.user.id, 'post', id, 'publish', [category.value])
  }
  showToast('发布成功（Demo）')
  resetForm()
  router.push(`/detail/${id}`)
}
</script>

<template>
  <div class="page">
    <van-nav-bar title="发布资源" />

    <van-form @submit="onSubmit" class="publish-form">
      <van-field
        v-model="category"
        is-link
        readonly
        name="category"
        label="分类"
        placeholder="点击选择分类"
        @click="showPicker = true"
      />
      <van-cell title="当前模式" :value="categoryName" />
      <van-cell title="AI辅助" label="可自动推荐分类并执行内容审核">
        <template #value>
          <div class="ai-btns">
            <van-button size="small" plain type="primary" @click="aiRecommendCategory">AI推荐分类</van-button>
            <van-button size="small" plain type="warning" @click="runModeration">AI内容审核</van-button>
          </div>
        </template>
      </van-cell>

      <van-popup v-model:show="showPicker" position="bottom">
        <van-picker
          :columns="columns"
          @confirm="onConfirm"
          @cancel="showPicker = false"
        />
      </van-popup>

      <!-- 动态表单项 -->
      <van-field v-model="form.title" name="标题" label="标题" placeholder="请输入标题" :rules="[{ required: true, message: '请输入标题' }]" />

      <template v-if="category === '二手'">
        <van-field v-model="form.price" name="价格" label="价格" placeholder="请输入交易价格" type="digit" />
        <van-field v-model="form.campus" name="校区" label="校区" placeholder="如：主校区" />
        <van-cell title="商品图片" label="最多6张，支持本地上传后预览">
          <template #value>
            <van-uploader
              :model-value="form.images.map((item) => ({ url: item }))"
              :max-count="6"
              multiple
              :after-read="onReadImages"
              :after-delete="onDeleteImage"
            />
          </template>
        </van-cell>
      </template>

      <template v-if="category === '拼车'">
        <van-field v-model="form.start" name="出发地" label="出发地" placeholder="从哪里上车" />
        <van-field v-model="form.end" name="目的地" label="目的地" placeholder="去哪里" />
        <van-field v-model="form.departTime" name="出发时间" label="出发时间" placeholder="如 2026-03-14 18:30" />
        <van-field v-model="form.seats" name="人数" label="人数" placeholder="可乘人数" type="digit" />
        <van-field v-model="form.fee" name="费用" label="费用" placeholder="单人费用" type="digit" />
      </template>

      <template v-if="category === '租房'">
        <van-field v-model="form.location" name="位置" label="位置" placeholder="如：南门地铁口" />
        <van-field v-model="form.houseType" name="户型" label="户型" placeholder="如：两室一厅" />
        <van-field v-model="form.rentTerm" name="租期" label="租期" placeholder="如：6个月起" />
        <van-field v-model="form.price" name="价格" label="价格" placeholder="月租金额" type="digit" />
        <van-cell title="房源图片" label="可选，建议上传实拍图提升可信度">
          <template #value>
            <van-uploader
              :model-value="form.rentImages.map((item) => ({ url: item }))"
              :max-count="6"
              multiple
              :after-read="onReadRentImages"
              :after-delete="onDeleteRentImage"
            />
          </template>
        </van-cell>
      </template>

      <template v-if="category === '组队'">
        <van-field v-model="form.activityType" name="活动类型" label="活动类型" placeholder="如：竞赛/创新创业" />
        <van-field v-model="form.activityTime" name="活动时间" label="活动时间" placeholder="如：周六晚 19:00" />
        <van-field v-model="form.activityLocation" name="活动地点" label="活动地点" placeholder="如：图书馆A402" />
        <van-field v-model="form.members" name="人数" label="人数需求" placeholder="还缺几人" type="digit" />
      </template>

      <van-field v-model="form.desc" name="描述" label="详情描述" placeholder="请详细描述..." rows="3" type="textarea" show-word-limit maxlength="200" />
      <van-field v-model="form.contactType" name="联系类型" label="联系类型" placeholder="微信 / QQ / 手机" />
      <van-field v-model="form.contact" name="联系方式" label="联系方式" placeholder="如 wx:12345" :rules="[{ required: true, message: '请输入联系方式' }]" />

      <div class="submit-wrap">
        <van-button round block type="primary" native-type="submit" :disabled="moderationBlocked">
          立即发布
        </van-button>
      </div>
    </van-form>
  </div>
</template>

<style scoped>
.publish-form {
  margin-top: 14px;
}

.submit-wrap {
  margin: 20px;
}

.ai-btns {
  display: flex;
  gap: 6px;
}
</style>
