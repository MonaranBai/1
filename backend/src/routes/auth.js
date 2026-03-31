const express = require('express')
const { query } = require('../db/mysql')

const router = express.Router()

function mapUser(row) {
  if (!row) return null
  return {
    id: row.id,
    phone: row.phone,
    nickname: row.nickname,
    studentId: row.student_id,
    campus: row.campus,
    qq: row.qq,
    wechat: row.wechat,
    avatar: row.avatar_url,
    studentCardImage: row.student_card_image_url,
    verificationStatus: row.verification_status,
    isVerified: Boolean(row.is_verified),
    creditScore: row.credit_score,
    status: row.status,
    createdAt: row.created_at
  }
}

router.post('/login', async (req, res, next) => {
  try {
    const { phone, nickname } = req.body || {}
    if (!phone || String(phone).length !== 11) {
      return res.status(400).json({ code: 400, message: '手机号格式不正确', data: null })
    }

    const users = await query('SELECT * FROM users WHERE phone = ? LIMIT 1', [phone])
    let user = users[0]

    if (!user) {
      const nick = nickname || '校园同学'
      const result = await query(
        `INSERT INTO users (phone, nickname, campus, verification_status, is_verified, credit_score, status)
         VALUES (?, ?, '主校区', 'unverified', 0, 100, 'active')`,
        [phone, nick]
      )
      const created = await query('SELECT * FROM users WHERE id = ? LIMIT 1', [result.insertId])
      user = created[0]
    }

    if (user.status === 'disabled') {
      return res.status(403).json({ code: 403, message: '该账号已被禁用', data: null })
    }

    const token = `demo-user-${user.id}`
    return res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        user: mapUser(user)
      }
    })
  } catch (error) {
    return next(error)
  }
})

router.post('/register', async (req, res, next) => {
  try {
    const { nickname, phone, studentId, wechat, qq, campus } = req.body || {}
    if (!nickname || !phone || String(phone).length !== 11) {
      return res.status(400).json({ code: 400, message: '昵称和手机号必填，手机号需11位', data: null })
    }

    const exists = await query('SELECT id FROM users WHERE phone = ? LIMIT 1', [phone])
    if (exists.length) {
      return res.status(409).json({ code: 409, message: '手机号已注册', data: null })
    }

    const result = await query(
      `INSERT INTO users
      (phone, nickname, student_id, campus, qq, wechat, verification_status, is_verified, credit_score, status)
      VALUES (?, ?, ?, ?, ?, ?, 'unverified', 0, 100, 'active')`,
      [phone, nickname, studentId || null, campus || '主校区', qq || null, wechat || null]
    )

    await query(
      `INSERT INTO credit_logs (user_id, change_value, reason, source_type)
       VALUES (?, 0, '新用户注册', 'system_rule')`,
      [result.insertId]
    )

    const rows = await query('SELECT * FROM users WHERE id = ? LIMIT 1', [result.insertId])
    return res.json({ code: 200, message: '注册成功', data: { user: mapUser(rows[0]) } })
  } catch (error) {
    return next(error)
  }
})

router.get('/profile', async (req, res, next) => {
  try {
    const { userId } = req.query
    if (!userId) {
      return res.status(400).json({ code: 400, message: '请提供 userId 查询参数', data: null })
    }
    const rows = await query('SELECT * FROM users WHERE id = ? LIMIT 1', [Number(userId)])
    if (!rows.length) {
      return res.status(404).json({ code: 404, message: '用户不存在', data: null })
    }
    const creditLogs = await query(
      `SELECT change_value AS changeValue, reason, created_at AS createdAt
       FROM credit_logs
       WHERE user_id = ?
       ORDER BY id DESC
       LIMIT 20`,
      [Number(userId)]
    )
    return res.json({ code: 200, message: '查询成功', data: { ...mapUser(rows[0]), creditLogs } })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
