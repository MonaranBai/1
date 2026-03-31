<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog, showToast } from 'vant'
import AMapLoader from '@amap/amap-jsapi-loader'
import { useAuthStore } from '../store/auth'
import { useBuddiesStore } from '../store/buddies'
import { buddiesApi } from '../api/buddiesApi'

const router = useRouter()
const authStore = useAuthStore()
const buddiesStore = useBuddiesStore()

const activityType = ref('全部')
const distanceLimit = ref(500)
const keyword = ref('')
const showPublish = ref(false)
const showTypePicker = ref(false)
const showReportPopup = ref(false)
const reportReason = ref('')
const reportTargetId = ref(null)
const showPickPointPopup = ref(false)
const viewMode = ref('list')
const mapContainerRef = ref(null)
const pickMapContainerRef = ref(null)
const mapError = ref('')
const mapReady = ref(false)
const userPosition = ref(null)
const pickPointLabel = ref('未选择')
const selectedPoint = ref(null)
const pickKeyword = ref('')
const searchingPoi = ref(false)
const poiResults = ref([])

const amapKey = import.meta.env.VITE_AMAP_KEY
let AMap = null
let amapInstance = null
let pickMapInstance = null
let buddyMarkers = []
let userMarker = null
let pickMarker = null
let geocoderInstance = null
let placeSearchInstance = null

const publishForm = ref({
  title: '',
  activityType: '饭搭子',
  location: '',
  eventTime: '',
  maxMembers: 2,
  tags: '',
  radiusMeter: 500,
  latitude: '',
  longitude: ''
})

const typeOptions = ['全部', '饭搭子', '运动搭子', '学习搭子', '看展搭子', '娱乐搭子']
const publishTypeOptions = ['饭搭子', '运动搭子', '学习搭子', '看展搭子', '娱乐搭子']

const statusTypeMap = {
  open: 'primary',
  full: 'warning',
  completed: 'success',
  cancelled: 'danger'
}

const statusTextMap = {
  open: '可加入',
  full: '已满员',
  completed: '已结束',
  cancelled: '已取消'
}

const allMatched = computed(() => buddiesStore.filterBuddies({
  keyword: keyword.value,
  activityType: activityType.value,
  maxDistance: 999999
}))

const toRad = (degree) => (degree * Math.PI) / 180

const calcDistance = (start, end) => {
  const earthRadius = 6378137
  const deltaLat = toRad(end[1] - start[1])
  const deltaLng = toRad(end[0] - start[0])
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(toRad(start[1])) * Math.cos(toRad(end[1])) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2)
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const getDistanceMeter = (item) => {
  const lat = Number(item.latitude || 0)
  const lng = Number(item.longitude || 0)
  if (userPosition.value && lat && lng) {
    return Math.round(calcDistance(userPosition.value, [lng, lat]))
  }
  return Number(item.distanceMeter || 0)
}

const list = computed(() => {
  const limit = Number(distanceLimit.value || 500)
  return allMatched.value.filter((item) => getDistanceMeter(item) <= limit)
})

const canPublishOrJoin = computed(() => {
  if (!authStore.isLoggedIn) return false
  if (!authStore.user?.isVerified) return false
  if (authStore.isCurrentUserRestricted) return false
  return true
})

const loadAmapSDK = async () => {
  if (!amapKey) {
    throw new Error('未配置 VITE_AMAP_KEY')
  }

  if (!AMap) {
    AMap = await AMapLoader.load({
      key: amapKey,
      version: '2.0',
      plugins: ['AMap.Scale', 'AMap.ToolBar', 'AMap.Geolocation', 'AMap.Geocoder', 'AMap.PlaceSearch']
    })
  }

  if (!geocoderInstance) {
    geocoderInstance = new AMap.Geocoder({ city: '全国' })
  }

  if (!placeSearchInstance) {
    placeSearchInstance = new AMap.PlaceSearch({
      pageSize: 10,
      pageIndex: 1,
      city: '全国'
    })
  }
}

const reverseGeocode = (lng, lat) => {
  return new Promise((resolve) => {
    if (!geocoderInstance) {
      resolve('')
      return
    }
    geocoderInstance.getAddress([lng, lat], (status, result) => {
      if (status === 'complete' && result?.regeocode?.formattedAddress) {
        resolve(result.regeocode.formattedAddress)
        return
      }
      resolve('')
    })
  })
}

const clearBuddyMarkers = () => {
  if (!amapInstance || !buddyMarkers.length) return
  amapInstance.remove(buddyMarkers)
  buddyMarkers = []
}

const getCurrentPosition = () => {
  return new Promise((resolve, reject) => {
    if (!AMap) {
      reject(new Error('地图SDK未初始化'))
      return
    }

    const geolocation = new AMap.Geolocation({
      enableHighAccuracy: true,
      timeout: 10000
    })

    geolocation.getCurrentPosition((status, result) => {
      if (status === 'complete' && result?.position) {
        resolve([Number(result.position.lng), Number(result.position.lat)])
        return
      }
      reject(new Error('定位失败'))
    })
  })
}

const fitMapView = () => {
  if (!amapInstance) return
  const overlays = [...buddyMarkers]
  if (userMarker) overlays.push(userMarker)
  if (overlays.length) {
    amapInstance.setFitView(overlays, false, [40, 40, 40, 40], 16)
  }
}

const renderBuddyMarkers = () => {
  if (!AMap || !amapInstance) return
  clearBuddyMarkers()

  buddyMarkers = list.value
    .filter((item) => Number(item.latitude) && Number(item.longitude))
    .map((item) => {
      const marker = new AMap.Marker({
        position: [Number(item.longitude), Number(item.latitude)],
        title: `${item.title} (${item.currentMembers}/${item.maxMembers})`
      })
      marker.on('click', () => toBuddyDetail(item.id))
      return marker
    })

  if (buddyMarkers.length) {
    amapInstance.add(buddyMarkers)
  }
  fitMapView()
}

const locateCurrentUser = () => {
  if (!AMap || !amapInstance) return
  getCurrentPosition()
    .then((position) => {
      userPosition.value = position

      if (userMarker) {
        amapInstance.remove(userMarker)
        userMarker = null
      }

      userMarker = new AMap.Marker({
        position,
        title: '我的位置',
        content: '<div style="width:14px;height:14px;border-radius:50%;background:#1989fa;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.25);"></div>'
      })

      amapInstance.add(userMarker)
      renderBuddyMarkers()
    })
    .catch(() => {
      // ignore geolocation error in map overview mode
    })
}

const initAmap = async () => {
  if (!amapKey) {
    mapError.value = '未配置 VITE_AMAP_KEY，地图功能不可用'
    mapReady.value = false
    return
  }

  await nextTick()
  if (!mapContainerRef.value) return

  try {
    mapError.value = ''
    await loadAmapSDK()

    if (!amapInstance) {
      const first = list.value[0]
      const center = first
        ? [Number(first.longitude || 121.4737), Number(first.latitude || 31.2304)]
        : [121.4737, 31.2304]

      amapInstance = new AMap.Map(mapContainerRef.value, {
        zoom: 15,
        center,
        resizeEnable: true,
        mapStyle: 'amap://styles/normal'
      })
      amapInstance.addControl(new AMap.Scale())
      amapInstance.addControl(new AMap.ToolBar())
    }

    locateCurrentUser()
    renderBuddyMarkers()
    mapReady.value = true
  } catch (error) {
    mapReady.value = false
    mapError.value = `地图加载失败：${error?.message || '未知错误'}`
  }
}

const openPickPointPopup = () => {
  if (!amapKey) {
    showToast('请先配置 VITE_AMAP_KEY 后再使用地图选点')
    return
  }
  showPickPointPopup.value = true
}

const updatePickMarker = async (lng, lat) => {
  if (!AMap || !pickMapInstance) return

  const position = [Number(lng), Number(lat)]
  selectedPoint.value = position
  publishForm.value.longitude = Number(lng).toFixed(6)
  publishForm.value.latitude = Number(lat).toFixed(6)

  if (pickMarker) {
    pickMapInstance.remove(pickMarker)
  }
  pickMarker = new AMap.Marker({ position })
  pickMapInstance.add(pickMarker)
  pickMapInstance.setCenter(position)

  const address = await reverseGeocode(Number(lng), Number(lat))
  pickPointLabel.value = address || `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}`
  if (!publishForm.value.location || publishForm.value.location.startsWith('坐标：')) {
    publishForm.value.location = address || `坐标：${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}`
  }
}

const useCurrentPositionForPick = async () => {
  if (!AMap) return
  try {
    const position = await getCurrentPosition()
    await updatePickMarker(position[0], position[1])
    showToast('已使用当前位置')
  } catch {
    showToast('定位失败，请手动点选位置')
  }
}

const searchPickPOI = () => {
  const query = pickKeyword.value.trim()
  if (!query) {
    showToast('请输入地点关键词')
    return
  }
  if (!placeSearchInstance) {
    showToast('地图搜索尚未初始化')
    return
  }

  searchingPoi.value = true
  placeSearchInstance.search(query, (status, result) => {
    searchingPoi.value = false
    if (status !== 'complete' || !result?.poiList?.pois) {
      poiResults.value = []
      showToast('未找到相关地点')
      return
    }

    poiResults.value = result.poiList.pois
      .filter((item) => item?.location)
      .map((item) => ({
        id: item.id,
        name: item.name,
        address: item.address || item.pname || '未知地址',
        lng: Number(item.location.lng),
        lat: Number(item.location.lat)
      }))
  })
}

const choosePoiResult = async (item) => {
  await updatePickMarker(item.lng, item.lat)
  publishForm.value.location = item.address ? `${item.name}（${item.address}）` : item.name
}

const initPickMap = async () => {
  await nextTick()
  if (!pickMapContainerRef.value) return

  try {
    await loadAmapSDK()
    const defaultCenter = selectedPoint.value || userPosition.value || [121.4737, 31.2304]

    if (!pickMapInstance) {
      pickMapInstance = new AMap.Map(pickMapContainerRef.value, {
        zoom: 16,
        center: defaultCenter,
        resizeEnable: true,
        mapStyle: 'amap://styles/normal'
      })
      pickMapInstance.addControl(new AMap.ToolBar())
      pickMapInstance.on('click', (evt) => {
        const lng = evt?.lnglat?.getLng?.()
        const lat = evt?.lnglat?.getLat?.()
        if (!lng || !lat) return
        updatePickMarker(lng, lat)
      })
    } else {
      pickMapInstance.setCenter(defaultCenter)
    }

    if (selectedPoint.value) {
      await updatePickMarker(selectedPoint.value[0], selectedPoint.value[1])
    }
  } catch (error) {
    showToast(`地图选点初始化失败：${error?.message || '未知错误'}`)
  }
}

const confirmPickPoint = () => {
  if (!selectedPoint.value) {
    showToast('请先在地图上点击选择位置')
    return
  }
  showPickPointPopup.value = false
  pickKeyword.value = ''
  poiResults.value = []
  showToast('已选中活动位置')
}

const submitPublish = async () => {
  if (!authStore.isLoggedIn) {
    showToast('请先登录')
    return
  }
  if (!authStore.user?.isVerified) {
    showToast('请先完成学生认证')
    return
  }
  if (authStore.isCurrentUserRestricted) {
    showToast('信用分低于60，暂不可发起组队')
    return
  }
  if (!publishForm.value.title || !publishForm.value.location || !publishForm.value.eventTime) {
    showToast('请完整填写标题、地点和时间')
    return
  }

  const tags = publishForm.value.tags
    .split('、')
    .map((item) => item.trim())
    .filter(Boolean)

  const payload = {
    title: publishForm.value.title,
    activityType: publishForm.value.activityType,
    location: publishForm.value.location,
    eventTime: publishForm.value.eventTime,
    maxMembers: Number(publishForm.value.maxMembers || 2),
    tags,
    radiusMeter: Number(publishForm.value.radiusMeter || 500),
    creatorId: authStore.user.id,
    creatorName: authStore.user.nickname,
    distanceMeter: 0,
    latitude: Number(publishForm.value.latitude || selectedPoint.value?.[1] || 31.2304),
    longitude: Number(publishForm.value.longitude || selectedPoint.value?.[0] || 121.4737)
  }

  await buddiesApi.create(payload)
  buddiesStore.createBuddy(payload)

  showPublish.value = false
  publishForm.value = {
    title: '',
    activityType: '饭搭子',
    location: '',
    eventTime: '',
    maxMembers: 2,
    tags: '',
    radiusMeter: 500,
    latitude: '',
    longitude: ''
  }
  selectedPoint.value = null
  pickPointLabel.value = '未选择'
  pickKeyword.value = ''
  poiResults.value = []
  showToast('搭子需求已发布')
}

const joinBuddy = async (item) => {
  if (!authStore.isLoggedIn) {
    showToast('请先登录')
    return
  }
  if (!authStore.user?.isVerified) {
    showToast('请先完成学生认证')
    return
  }
  if (authStore.isCurrentUserRestricted) {
    showToast('信用分低于60，暂不可加入')
    return
  }
  if (getDistanceMeter(item) > Number(item.radiusMeter || 500)) {
    showToast('你当前不在活动匹配范围内')
    return
  }

  await buddiesApi.join(item.id, { userId: authStore.user.id })
  const ok = buddiesStore.joinBuddy(item.id, authStore.user.id, authStore.user.nickname)
  if (!ok) {
    showToast('当前活动不可加入或你已在队伍中')
    return
  }
  showToast('加入成功，祝你们玩得开心')
}

const finishBuddy = async (item) => {
  await showConfirmDialog({ title: '结束组队', message: '确认结束本次搭子活动？' })
  await buddiesApi.updateStatus(item.id, { status: 'completed' })
  buddiesStore.completeBuddy(item.id)
  showToast('活动已结束，可进行互评')
}

const quickEvaluate = async (item, rating) => {
  const members = (item.members || []).filter((member) => member.userId !== authStore.user.id)
  const target = members[0]
  if (!target) {
    showToast('暂无可评价成员')
    return
  }

  await buddiesApi.evaluate(item.id, { rating, toUserId: target.userId })
  const change = buddiesStore.evaluateBuddy(item.id, authStore.user.id, target.userId, rating, '搭子圈活动互评')
  showToast(`互评完成，信用分变动 ${change >= 0 ? '+' : ''}${change}`)
}

const toBuddyDetail = (id) => {
  router.push(`/buddies/${id}`)
}

const selectPublishType = ({ selectedOptions }) => {
  const next = selectedOptions?.[0]?.value
  if (next) publishForm.value.activityType = next
  showTypePicker.value = false
}

const openReport = (id) => {
  if (!authStore.isLoggedIn) {
    showToast('请先登录后举报')
    return
  }
  reportTargetId.value = id
  reportReason.value = ''
  showReportPopup.value = true
}

const submitReport = async () => {
  if (!reportTargetId.value) return
  if (!reportReason.value.trim()) {
    showToast('请填写举报原因')
    return
  }

  const payload = {
    reason: reportReason.value.trim(),
    reporter: authStore.user.nickname,
    reporterId: authStore.user.id
  }

  await buddiesApi.report(reportTargetId.value, payload)
  buddiesStore.reportBuddy(reportTargetId.value, payload.reason, payload.reporter, payload.reporterId)
  showReportPopup.value = false
  reportReason.value = ''
  reportTargetId.value = null
  showToast('举报已提交，管理员将尽快处理')
}

watch(
  () => viewMode.value,
  async (mode) => {
    if (mode === 'map') {
      await initAmap()
    }
  }
)

watch(
  () => showPickPointPopup.value,
  async (show) => {
    if (show) {
      await initPickMap()
    }
  }
)

watch(
  () => list.value,
  () => {
    if (viewMode.value === 'map' && amapInstance) {
      renderBuddyMarkers()
    }
  },
  { deep: true }
)

onBeforeUnmount(() => {
  clearBuddyMarkers()
  if (amapInstance) {
    amapInstance.destroy()
    amapInstance = null
  }
  if (pickMapInstance) {
    pickMapInstance.destroy()
    pickMapInstance = null
  }
  AMap = null
})
</script>

<template>
  <div class="page">
    <van-nav-bar title="搭子圈" right-text="发起" @click-right="showPublish = true" />

    <van-search v-model="keyword" shape="round" placeholder="搜索活动 / 地点 / 标签" />

    <div class="filter-row">
      <div class="type-scroll">
        <van-tag
          v-for="type in typeOptions"
          :key="type"
          round
          :type="activityType === type ? 'primary' : 'default'"
          @click="activityType = type"
        >
          {{ type }}
        </van-tag>
      </div>

      <van-dropdown-menu>
        <van-dropdown-item
          v-model="distanceLimit"
          :options="[
            { text: '500米内', value: 500 },
            { text: '1公里内', value: 1000 },
            { text: '2公里内', value: 2000 }
          ]"
        />
      </van-dropdown-menu>
    </div>

    <div class="tip-panel">
      匹配默认范围为校内及周边500米，可按需调整。
      <span v-if="!authStore.user?.isVerified"> 当前账号未认证，仅可浏览。</span>
    </div>

    <div class="mode-switch">
      <van-tag round :type="viewMode === 'list' ? 'primary' : 'default'" @click="viewMode = 'list'">列表模式</van-tag>
      <van-tag round :type="viewMode === 'map' ? 'primary' : 'default'" @click="viewMode = 'map'">地图模式</van-tag>
    </div>

    <van-empty v-if="!list.length" description="附近暂无匹配搭子" />

    <div v-if="viewMode === 'map' && list.length" class="map-section soft-card">
      <div class="map-title">附近搭子分布（高德地图）</div>
      <div ref="mapContainerRef" class="amap-container"></div>
      <div v-if="mapError" class="map-error">{{ mapError }}</div>
      <div v-else-if="!mapReady" class="map-loading">地图加载中...</div>
      <div class="map-tip">点击地图标记可查看活动详情；已启用定位后将按实时距离展示。</div>
      <div class="map-legend">
        <div class="legend-row" v-for="item in list" :key="`legend-${item.id}`" @click="toBuddyDetail(item.id)">
          <span>{{ item.title }}</span>
          <span>{{ item.location }} · {{ getDistanceMeter(item) }}m</span>
        </div>
      </div>
    </div>

    <van-cell-group v-if="viewMode === 'list'" inset class="buddy-card soft-card" v-for="item in list" :key="item.id">
      <van-cell :title="item.title" :label="`${item.activityType} · ${item.location}`" is-link @click="toBuddyDetail(item.id)">
        <template #value>
          <van-tag :type="statusTypeMap[item.status] || 'default'">{{ statusTextMap[item.status] || item.status }}</van-tag>
        </template>
      </van-cell>

      <div class="buddy-meta">
        <span>发起人：{{ item.creatorName }}</span>
        <span>{{ getDistanceMeter(item) }}m</span>
      </div>
      <div class="buddy-meta">
        <span>时间：{{ item.eventTime }}</span>
        <span>人数：{{ item.currentMembers }}/{{ item.maxMembers }}</span>
      </div>
      <div class="buddy-tags">
        <van-tag v-for="tag in item.tags" :key="`${item.id}-${tag}`" plain type="primary">{{ tag }}</van-tag>
      </div>

      <div class="buddy-actions">
        <van-button size="small" type="default" plain @click="toBuddyDetail(item.id)">
          详情
        </van-button>
        <van-button size="small" type="primary" plain :disabled="!canPublishOrJoin || item.status !== 'open'" @click="joinBuddy(item)">
          加入组队
        </van-button>
        <van-button v-if="item.creatorId === authStore.user.id && ['open', 'full'].includes(item.status)" size="small" type="warning" plain @click="finishBuddy(item)">
          结束活动
        </van-button>
        <van-button v-if="item.status === 'completed' && authStore.isLoggedIn" size="small" type="success" plain @click="quickEvaluate(item, 'good')">
          互评(+2)
        </van-button>
        <van-button size="small" type="danger" plain @click="openReport(item.id)">
          举报
        </van-button>
      </div>
    </van-cell-group>

    <van-popup v-model:show="showPublish" round position="bottom" :style="{ padding: '16px' }">
      <h3 style="margin: 0 0 10px;">发起搭子需求</h3>
      <van-field v-model="publishForm.title" label="标题" placeholder="如：今晚操场夜跑" />
      <van-field
        v-model="publishForm.activityType"
        label="类型"
        is-link
        readonly
        placeholder="请选择"
        @click="showTypePicker = true"
      />
      <van-field v-model="publishForm.location" label="地点" placeholder="如：东操场看台" />
      <van-field v-model="publishForm.eventTime" label="时间" placeholder="2026-03-17 20:00" />
      <van-field v-model="publishForm.maxMembers" label="人数上限" type="digit" placeholder="2-6人" />
      <van-field v-model="publishForm.tags" label="兴趣标签" placeholder="用、分隔，如：跑步、减脂" />
      <van-field v-model="publishForm.radiusMeter" label="匹配半径(米)" type="digit" placeholder="默认500" />
      <van-cell title="地图选点" :value="pickPointLabel" is-link @click="openPickPointPopup" />
      <div class="buddy-actions" style="padding: 12px 0 0;">
        <van-button block type="primary" :disabled="!canPublishOrJoin" @click="submitPublish">确认发布</van-button>
      </div>
    </van-popup>

    <van-popup v-model:show="showTypePicker" round position="bottom">
      <van-picker
        title="选择搭子类型"
        :columns="publishTypeOptions.map((item) => ({ text: item, value: item }))"
        @confirm="selectPublishType"
        @cancel="showTypePicker = false"
      />
    </van-popup>

    <van-popup v-model:show="showReportPopup" round position="bottom" :style="{ padding: '16px' }">
      <h3 style="margin: 0 0 10px;">举报搭子活动</h3>
      <van-field v-model="reportReason" label="原因" type="textarea" rows="3" placeholder="请填写举报原因，如骚扰、虚假活动等" />
      <div class="buddy-actions" style="padding: 12px 0 0;">
        <van-button block type="danger" @click="submitReport">提交举报</van-button>
      </div>
    </van-popup>

    <van-popup v-model:show="showPickPointPopup" round position="bottom" :style="{ padding: '16px' }">
      <h3 style="margin: 0 0 10px;">地图选点</h3>
      <div class="pick-actions">
        <van-field v-model="pickKeyword" placeholder="搜索教学楼/食堂/宿舍" clearable>
          <template #button>
            <van-button size="small" type="primary" :loading="searchingPoi" @click="searchPickPOI">搜索</van-button>
          </template>
        </van-field>
        <van-button size="small" plain type="primary" @click="useCurrentPositionForPick">用我的位置</van-button>
      </div>
      <div ref="pickMapContainerRef" class="pick-amap-container"></div>
      <div v-if="poiResults.length" class="poi-list">
        <div class="poi-item" v-for="item in poiResults" :key="item.id" @click="choosePoiResult(item)">
          <div class="poi-name">{{ item.name }}</div>
          <div class="poi-address">{{ item.address }}</div>
        </div>
      </div>
      <div class="map-tip">点击地图任意位置选择活动地点，确认后将自动回填经纬度与地点。</div>
      <div class="buddy-actions" style="padding: 12px 0 0;">
        <van-button block type="primary" @click="confirmPickPoint">确认位置</van-button>
      </div>
    </van-popup>
  </div>
</template>

<style scoped>
.filter-row {
  margin-top: 6px;
}

.type-scroll {
  padding: 0 12px 10px;
  display: flex;
  gap: 8px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.type-scroll::-webkit-scrollbar {
  display: none;
}

.tip-panel {
  margin: 10px 12px;
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--van-orange-light);
  color: var(--van-orange-dark);
  font-size: 12px;
}

.mode-switch {
  display: flex;
  gap: 8px;
  padding: 0 12px;
}

.map-section {
  margin: 10px 12px 0;
  padding: 12px;
}

.map-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
}

.amap-container {
  height: 230px;
  border-radius: 12px;
  overflow: hidden;
  background: var(--van-gray-2);
}

.pick-amap-container {
  height: 280px;
  border-radius: 12px;
  overflow: hidden;
  background: var(--van-gray-2);
}

.pick-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.poi-list {
  margin-top: 10px;
  max-height: 150px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.poi-item {
  background: var(--van-background);
  border-radius: 8px;
  padding: 8px 10px;
}

.poi-name {
  font-size: 13px;
  font-weight: 600;
}

.poi-address {
  margin-top: 2px;
  font-size: 12px;
  color: var(--van-text-color-2);
}

.map-loading,
.map-error,
.map-tip {
  margin-top: 8px;
  font-size: 12px;
}

.map-loading {
  color: var(--van-primary-color);
}

.map-error {
  color: var(--van-danger-color);
}

.map-tip {
  color: var(--van-text-color-2);
}

.map-legend {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-row {
  background: var(--van-background);
  border-radius: 8px;
  padding: 8px 10px;
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
}

.buddy-card {
  margin-top: 10px;
  border-radius: 14px;
}

.buddy-meta {
  padding: 2px 16px;
  display: flex;
  justify-content: space-between;
  color: #646566;
  font-size: 12px;
}

.buddy-tags {
  padding: 8px 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.buddy-actions {
  padding: 0 16px 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
