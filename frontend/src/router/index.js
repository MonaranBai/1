import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Publish from '../views/Publish.vue'
import Profile from '../views/Profile.vue'
import Detail from '../views/Detail.vue'
import MyPosts from '../views/MyPosts.vue'
import Auth from '../views/Auth.vue'
import ProfileEdit from '../views/ProfileEdit.vue'
import Verification from '../views/Verification.vue'
import AdminDashboard from '../views/AdminDashboard.vue'
import Tasks from '../views/Tasks.vue'
import TaskDetail from '../views/TaskDetail.vue'
import Buddies from '../views/Buddies.vue'
import BuddyDetail from '../views/BuddyDetail.vue'
import { useAuthStore } from '../store/auth'

const routes = [
  { path: '/', component: Home },
  { path: '/publish', component: Publish, meta: { requiresUser: true } },
  { path: '/profile', component: Profile },
  { path: '/detail/:id', component: Detail },
  { path: '/my-posts', component: MyPosts, meta: { requiresUser: true } },
  { path: '/auth', component: Auth },
  { path: '/profile/edit', component: ProfileEdit, meta: { requiresUser: true } },
  { path: '/verification', component: Verification, meta: { requiresUser: true } },
  { path: '/admin', component: AdminDashboard, meta: { requiresAdmin: true } },
  { path: '/tasks', component: Tasks },
  { path: '/tasks/:id', component: TaskDetail },
  { path: '/buddies', component: Buddies },
  { path: '/buddies/:id', component: BuddyDetail }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAdmin && !authStore.isAdminLoggedIn) {
    return '/auth'
  }

  if (to.meta.requiresUser && !authStore.isLoggedIn) {
    return '/auth'
  }

  return true
})

export default router
