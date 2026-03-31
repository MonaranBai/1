const express = require('express')
const { pool, query } = require('../db/mysql')

const router = express.Router()

function safeParseJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback
  } catch (error) {
    return fallback
  }
}

async function getMembersByBuddyId(buddyId) {
  const members = await query(
    `SELECT user_id AS userId, nickname_snapshot AS nickname, role_type AS roleType
     FROM buddy_members
     WHERE buddy_id = ? AND join_status = 'joined'
     ORDER BY id ASC`,
    [buddyId]
  )
  return members
}

async function mapBuddy(row) {
  const members = await getMembersByBuddyId(row.id)
  return {
    id: row.id,
    title: row.title,
    activityType: row.activity_type,
    location: row.location_text,
    latitude: Number(row.latitude || 0),
    longitude: Number(row.longitude || 0),
    radiusMeter: Number(row.radius_meter || 500),
    distanceMeter: Number(row.distance_meter || 0),
    eventTime: row.event_time,
    maxMembers: Number(row.max_members || 2),
    currentMembers: Number(row.current_members || 1),
    tags: safeParseJson(row.tags_json, []),
    status: row.status,
    creatorId: row.creator_id,
    creatorName: row.creator_name,
    members,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

router.get('/', async (req, res, next) => {
  try {
    const rows = await query('SELECT * FROM buddy_posts ORDER BY id DESC')
    const data = await Promise.all(rows.map((row) => mapBuddy(row)))
    return res.json({ code: 200, message: '查询成功', data })
  } catch (error) {
    return next(error)
  }
})

router.post('/', async (req, res, next) => {
  const conn = await pool.getConnection()
  try {
    const payload = req.body || {}
    if (!payload.title || !payload.location || !payload.eventTime) {
      return res.status(400).json({ code: 400, message: '标题、地点、活动时间必填', data: null })
    }
    const creatorId = Number(payload.creatorId || 0)
    if (!creatorId) {
      return res.status(400).json({ code: 400, message: 'creatorId 必填', data: null })
    }

    const creatorRows = await query('SELECT id, nickname FROM users WHERE id = ? LIMIT 1', [creatorId])
    if (!creatorRows.length) {
      return res.status(400).json({ code: 400, message: '发起人不存在', data: null })
    }

    await conn.beginTransaction()
    const [insertResult] = await conn.execute(
      `INSERT INTO buddy_posts
      (creator_id, creator_name, title, activity_type, location_text, latitude, longitude, radius_meter, distance_meter, event_time, max_members, current_members, tags_json, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 'open')`,
      [
        creatorId,
        payload.creatorName || creatorRows[0].nickname,
        payload.title,
        payload.activityType || '活动',
        payload.location,
        Number(payload.latitude || 0),
        Number(payload.longitude || 0),
        Number(payload.radiusMeter || 500),
        Number(payload.distanceMeter || 0),
        payload.eventTime,
        Number(payload.maxMembers || 2),
        JSON.stringify(payload.tags || [])
      ]
    )

    await conn.execute(
      `INSERT INTO buddy_members (buddy_id, user_id, nickname_snapshot, role_type, join_status)
       VALUES (?, ?, ?, 'creator', 'joined')`,
      [insertResult.insertId, creatorId, payload.creatorName || creatorRows[0].nickname]
    )

    await conn.commit()
    const rows = await query('SELECT * FROM buddy_posts WHERE id = ? LIMIT 1', [insertResult.insertId])
    const data = await mapBuddy(rows[0])
    return res.json({ code: 200, message: '创建成功', data })
  } catch (error) {
    await conn.rollback()
    return next(error)
  } finally {
    conn.release()
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const rows = await query('SELECT * FROM buddy_posts WHERE id = ? LIMIT 1', [id])
    if (!rows.length) {
      return res.status(404).json({ code: 404, message: '活动不存在', data: null })
    }
    const data = await mapBuddy(rows[0])
    return res.json({ code: 200, message: '查询成功', data })
  } catch (error) {
    return next(error)
  }
})

router.post('/:id/join', async (req, res, next) => {
  const conn = await pool.getConnection()
  try {
    const buddyId = Number(req.params.id)
    const userId = Number(req.body?.userId || 0)
    if (!userId) {
      return res.status(400).json({ code: 400, message: 'userId 必填', data: null })
    }

    const userRows = await query('SELECT id, nickname FROM users WHERE id = ? LIMIT 1', [userId])
    if (!userRows.length) {
      return res.status(400).json({ code: 400, message: '用户不存在', data: null })
    }

    const buddyRows = await query('SELECT * FROM buddy_posts WHERE id = ? LIMIT 1', [buddyId])
    if (!buddyRows.length) {
      return res.status(404).json({ code: 404, message: '活动不存在', data: null })
    }
    const buddy = buddyRows[0]
    if (buddy.status !== 'open') {
      return res.status(409).json({ code: 409, message: '当前活动不可加入', data: null })
    }

    const joinedRows = await query(
      `SELECT id FROM buddy_members WHERE buddy_id = ? AND user_id = ? AND join_status = 'joined' LIMIT 1`,
      [buddyId, userId]
    )
    if (joinedRows.length) {
      return res.status(409).json({ code: 409, message: '你已在队伍中', data: null })
    }

    await conn.beginTransaction()
    await conn.execute(
      `INSERT INTO buddy_members (buddy_id, user_id, nickname_snapshot, role_type, join_status)
       VALUES (?, ?, ?, 'member', 'joined')
       ON DUPLICATE KEY UPDATE join_status = 'joined'`,
      [buddyId, userId, userRows[0].nickname]
    )
    await conn.execute(
      `UPDATE buddy_posts
       SET current_members = current_members + 1,
           status = CASE WHEN current_members + 1 >= max_members THEN 'full' ELSE status END
       WHERE id = ?`,
      [buddyId]
    )
    await conn.commit()

    const latestRows = await query('SELECT * FROM buddy_posts WHERE id = ? LIMIT 1', [buddyId])
    const data = await mapBuddy(latestRows[0])
    return res.json({ code: 200, message: '加入成功', data })
  } catch (error) {
    await conn.rollback()
    return next(error)
  } finally {
    conn.release()
  }
})

router.patch('/:id/status', async (req, res, next) => {
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
    const rows = await query('SELECT * FROM buddy_posts WHERE id = ? LIMIT 1', [id])
    const data = await mapBuddy(rows[0])
    return res.json({ code: 200, message: '状态更新成功', data })
  } catch (error) {
    return next(error)
  }
})

router.post('/:id/evaluate', async (req, res, next) => {
  const conn = await pool.getConnection()
  try {
    const buddyId = Number(req.params.id)
    const fromUserId = Number(req.body?.fromUserId || req.body?.creatorId || 1)
    const toUserId = Number(req.body?.toUserId || 0)
    const rating = req.body?.rating
    const scoreMap = { good: 2, neutral: 0, bad: -2 }
    const creditChange = scoreMap[rating]
    if (!toUserId || creditChange === undefined) {
      return res.status(400).json({ code: 400, message: 'toUserId 和 rating 必填', data: null })
    }

    await conn.beginTransaction()
    await conn.execute(
      `INSERT INTO buddy_evaluations (buddy_id, from_user_id, to_user_id, rating, comment, credit_change)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment), credit_change = VALUES(credit_change)`,
      [buddyId, fromUserId, toUserId, rating, req.body?.comment || '', creditChange]
    )
    await conn.execute(
      'UPDATE users SET credit_score = LEAST(100, GREATEST(0, credit_score + ?)) WHERE id = ?',
      [creditChange, toUserId]
    )
    await conn.execute(
      `INSERT INTO credit_logs (user_id, change_value, reason, source_type, source_id)
       VALUES (?, ?, ?, 'buddy_evaluation', ?)`,
      [toUserId, creditChange, `搭子活动#${buddyId}互评(${rating})`, buddyId]
    )
    await conn.commit()

    return res.json({
      code: 200,
      message: '评价成功',
      data: { buddyId, fromUserId, toUserId, rating, creditChange }
    })
  } catch (error) {
    await conn.rollback()
    return next(error)
  } finally {
    conn.release()
  }
})

router.post('/:id/report', async (req, res, next) => {
  try {
    const buddyId = Number(req.params.id)
    const reason = req.body?.reason
    if (!reason) {
      return res.status(400).json({ code: 400, message: '举报原因必填', data: null })
    }
    const buddyRows = await query('SELECT id FROM buddy_posts WHERE id = ? LIMIT 1', [buddyId])
    if (!buddyRows.length) {
      return res.status(404).json({ code: 404, message: '活动不存在', data: null })
    }

    const result = await query(
      `INSERT INTO buddy_reports (buddy_id, reporter_id, reporter_name, reason, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [
        buddyId,
        req.body?.reporterId ? Number(req.body.reporterId) : null,
        req.body?.reporter || '游客',
        reason
      ]
    )
    return res.json({ code: 200, message: '举报提交成功', data: { id: result.insertId, buddyId, reason } })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
