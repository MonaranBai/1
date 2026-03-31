const express = require('express')
const { query } = require('../db/mysql')

const router = express.Router()

function safeParseJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback
  } catch (error) {
    return fallback
  }
}

function mapPost(row) {
  const extra = safeParseJson(row.extra_json, {})
  return {
    id: row.id,
    userId: row.user_id,
    publisher: row.publisher_name,
    title: row.title,
    category: row.category,
    description: row.content,
    ...extra,
    images: safeParseJson(row.images_json, []),
    tags: safeParseJson(row.tags_json, []),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page || 1), 1)
    const pageSize = Math.min(Math.max(Number(req.query.pageSize || 20), 1), 100)
    const offset = (page - 1) * pageSize
    const category = req.query.category ? String(req.query.category) : null

    const where = ['status <> \'deleted\'']
    const params = []
    if (category) {
      where.push('category = ?')
      params.push(category)
    }

    const listSql = `
      SELECT *
      FROM info_posts
      WHERE ${where.join(' AND ')}
      ORDER BY id DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `
    const totalSql = `SELECT COUNT(1) AS total FROM info_posts WHERE ${where.join(' AND ')}`

    const [rows, totalRows] = await Promise.all([
      query(listSql, params),
      query(totalSql, params)
    ])

    return res.json({
      code: 200,
      message: '查询成功',
      data: {
        list: rows.map(mapPost),
        total: totalRows[0]?.total || 0,
        page,
        pageSize
      }
    })
  } catch (error) {
    return next(error)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const payload = req.body || {}
    if (!payload.title || !payload.description) {
      return res.status(400).json({ code: 400, message: '标题和描述必填', data: null })
    }

    const userId = Number(payload.userId || 1)
    const users = await query('SELECT id, nickname FROM users WHERE id = ? LIMIT 1', [userId])
    if (!users.length) {
      return res.status(400).json({ code: 400, message: '发布用户不存在，请先注册', data: null })
    }

    const extra = {
      price: payload.price,
      campus: payload.campus,
      start: payload.start,
      destination: payload.destination,
      departTime: payload.departTime,
      seats: payload.seats,
      fee: payload.fee,
      location: payload.location,
      houseType: payload.houseType,
      rentTerm: payload.rentTerm,
      activityType: payload.activityType,
      activityTime: payload.activityTime,
      activityLocation: payload.activityLocation,
      members: payload.members,
      contactType: payload.contactType,
      contactInfo: payload.contactInfo
    }

    const result = await query(
      `INSERT INTO info_posts
      (user_id, publisher_name, title, category, content, location_text, images_json, tags_json, extra_json, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'visible')`,
      [
        userId,
        payload.publisher || users[0].nickname,
        payload.title,
        payload.category || 'general',
        payload.description,
        payload.location || '',
        JSON.stringify(payload.images || []),
        JSON.stringify(payload.tags || []),
        JSON.stringify(extra)
      ]
    )

    const rows = await query('SELECT * FROM info_posts WHERE id = ? LIMIT 1', [result.insertId])
    return res.json({ code: 200, message: '发布成功', data: mapPost(rows[0]) })
  } catch (error) {
    return next(error)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const rows = await query('SELECT * FROM info_posts WHERE id = ? AND status <> \'deleted\' LIMIT 1', [id])
    if (!rows.length) {
      return res.status(404).json({ code: 404, message: '帖子不存在', data: null })
    }

    await query('UPDATE info_posts SET view_count = view_count + 1 WHERE id = ?', [id])
    return res.json({ code: 200, message: '查询成功', data: mapPost(rows[0]) })
  } catch (error) {
    return next(error)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const result = await query('UPDATE info_posts SET status = \'deleted\' WHERE id = ?', [id])
    if (!result.affectedRows) {
      return res.status(404).json({ code: 404, message: '帖子不存在', data: null })
    }
    return res.json({ code: 200, message: '删除成功', data: { id } })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
