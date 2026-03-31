const express = require('express')
const authRoutes = require('./auth')
const postsRoutes = require('./posts')
const tasksRoutes = require('./tasks')
const buddiesRoutes = require('./buddies')
const adminRoutes = require('./admin')
const reportsRoutes = require('./reports')
const moderationRoutes = require('./moderation')

const router = express.Router()

router.use('/auth', authRoutes)
router.use('/posts', postsRoutes)
router.use('/tasks', tasksRoutes)
router.use('/buddies', buddiesRoutes)
router.use('/admin', adminRoutes)
router.use('/reports', reportsRoutes)
router.use('/moderation', moderationRoutes)

module.exports = router
