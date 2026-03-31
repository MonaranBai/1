const express = require('express')
const { query } = require('../db/mysql')

const router = express.Router()

router.get('/logs', async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT id, target_type AS targetType, target_id AS targetId, action,
              operator_admin_id AS operatorAdminId, reason, note, created_at AS createdAt
       FROM moderation_logs
       ORDER BY id DESC
       LIMIT 100`
    )
    return res.json({ code: 200, message: '查询成功', data: rows })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
