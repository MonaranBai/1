const express = require('express')
const { pool, query } = require('../db/mysql')

const router = express.Router()

router.post('/login', async (req, res, next) => {
  try {
    const { account, password } = req.body || {}
    if (account === 'admin' && password === 'admin123') {
      return res.json({
        code: 200,
        message: '管理员登录成功',
        data: { token: 'demo-admin-token', nickname: '平台管理员' }
      })
    }
    return res.status(401).json({ code: 401, message: '账号或密码错误', data: null })
  } catch (error) {
    return next(error)
  }
})

router.get('/users', async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT id, phone, nickname, student_id AS studentId, campus, qq, wechat,
              verification_status AS verificationStatus, is_verified AS isVerified,
              credit_score AS creditScore, status, created_at AS createdAt
       FROM users
       ORDER BY id DESC`
    )
    return res.json({ code: 200, message: '查询成功', data: rows })
  } catch (error) {
    return next(error)
  }
})

router.patch('/users/:id/status', async (req, res, next) => {
  try {
    const userId = Number(req.params.id)
    const status = req.body?.status
    const allow = ['active', 'disabled', 'deleted']
    if (!allow.includes(status)) {
      return res.status(400).json({ code: 400, message: '不支持的状态值', data: null })
    }
    const result = await query('UPDATE users SET status = ? WHERE id = ?', [status, userId])
    if (!result.affectedRows) {
      return res.status(404).json({ code: 404, message: '用户不存在', data: null })
    }
    return res.json({ code: 200, message: '状态更新成功', data: { id: userId, status } })
  } catch (error) {
    return next(error)
  }
})

router.patch('/users/:id/credit', async (req, res, next) => {
  const conn = await pool.getConnection()
  try {
    const userId = Number(req.params.id)
    const change = Number(req.body?.change || 0)
    const reason = req.body?.reason || '管理员调整信用分'
    if (!Number.isFinite(change)) {
      return res.status(400).json({ code: 400, message: 'change 必须为数字', data: null })
    }

    await conn.beginTransaction()
    const [updateResult] = await conn.execute(
      'UPDATE users SET credit_score = LEAST(100, GREATEST(0, credit_score + ?)) WHERE id = ?',
      [change, userId]
    )
    if (!updateResult.affectedRows) {
      await conn.rollback()
      return res.status(404).json({ code: 404, message: '用户不存在', data: null })
    }
    await conn.execute(
      `INSERT INTO credit_logs (user_id, change_value, reason, source_type)
       VALUES (?, ?, ?, 'manual')`,
      [userId, change, reason]
    )
    await conn.commit()

    const users = await query('SELECT credit_score AS creditScore FROM users WHERE id = ? LIMIT 1', [userId])
    return res.json({ code: 200, message: '信用分更新成功', data: { id: userId, creditScore: users[0].creditScore } })
  } catch (error) {
    await conn.rollback()
    return next(error)
  } finally {
    conn.release()
  }
})

router.patch('/users/:id/verify', async (req, res, next) => {
  try {
    const userId = Number(req.params.id)
    const approved = Boolean(req.body?.approved)
    const verificationStatus = approved ? 'verified' : 'rejected'
    const isVerified = approved ? 1 : 0
    const result = await query(
      'UPDATE users SET verification_status = ?, is_verified = ? WHERE id = ?',
      [verificationStatus, isVerified, userId]
    )
    if (!result.affectedRows) {
      return res.status(404).json({ code: 404, message: '用户不存在', data: null })
    }
    return res.json({ code: 200, message: '审核完成', data: { id: userId, verificationStatus, isVerified: Boolean(isVerified) } })
  } catch (error) {
    return next(error)
  }
})

router.get('/reports', async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT pr.id, pr.post_id AS postId, pr.reporter_id AS reporterId, pr.reporter_name AS reporter,
              pr.reason, pr.status, pr.admin_note AS adminNote, pr.created_at AS createdAt,
              ip.title AS postTitle
       FROM post_reports pr
       LEFT JOIN info_posts ip ON ip.id = pr.post_id
       ORDER BY pr.id DESC`
    )
    return res.json({ code: 200, message: '查询成功', data: rows })
  } catch (error) {
    return next(error)
  }
})

router.get('/buddy-reports', async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT br.id, br.buddy_id AS buddyId, br.reporter_id AS reporterId, br.reporter_name AS reporter,
              br.reason, br.status, br.admin_note AS adminNote, br.created_at AS createdAt,
              bp.title AS buddyTitle
       FROM buddy_reports br
       LEFT JOIN buddy_posts bp ON bp.id = br.buddy_id
       ORDER BY br.id DESC`
    )
    return res.json({ code: 200, message: '查询成功', data: rows })
  } catch (error) {
    return next(error)
  }
})

router.patch('/buddy-reports/:id/status', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const status = req.body?.status
    const adminNote = req.body?.adminNote || ''
    const allow = ['pending', 'approved', 'rejected']
    if (!allow.includes(status)) {
      return res.status(400).json({ code: 400, message: '不支持的状态值', data: null })
    }
    const result = await query('UPDATE buddy_reports SET status = ?, admin_note = ? WHERE id = ?', [status, adminNote, id])
    if (!result.affectedRows) {
      return res.status(404).json({ code: 404, message: '举报不存在', data: null })
    }
    return res.json({ code: 200, message: '状态更新成功', data: { id, status, adminNote } })
  } catch (error) {
    return next(error)
  }
})

router.get('/buddies', async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT id, title, activity_type AS activityType, location_text AS location,
              status, creator_name AS creatorName, event_time AS eventTime,
              current_members AS currentMembers, max_members AS maxMembers, created_at AS createdAt
       FROM buddy_posts
       ORDER BY id DESC`
    )
    return res.json({ code: 200, message: '查询成功', data: rows })
  } catch (error) {
    return next(error)
  }
})

router.patch('/buddies/:id/status', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const status = req.body?.status
    const allow = ['open', 'full', 'completed', 'cancelled', 'disabled']
    if (!allow.includes(status)) {
      return res.status(400).json({ code: 400, message: '不支持的状态值', data: null })
    }
    const result = await query('UPDATE buddy_posts SET status = ? WHERE id = ?', [status, id])
    if (!result.affectedRows) {
      return res.status(404).json({ code: 404, message: '活动不存在', data: null })
    }
    return res.json({ code: 200, message: '状态更新成功', data: { id, status } })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
