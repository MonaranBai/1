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

function mapTask(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    location: row.location_text,
    reward: Number(row.reward_amount || 0),
    deadline: row.due_time,
    tags: safeParseJson(row.tags_json, []),
    images: safeParseJson(row.images_json, []),
    status: row.status,
    publisherId: row.owner_id,
    publisher: row.owner_name,
    helperId: row.helper_id,
    helperName: row.helper_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

router.get('/', async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT * FROM task_posts
       ORDER BY id DESC`
    )
    return res.json({ code: 200, message: '查询成功', data: rows.map(mapTask) })
  } catch (error) {
    return next(error)
  }
})

router.get('/recommendation', async (req, res, next) => {
  try {
    const userId = Number(req.query.userId || 0)
    if (!userId) {
      const fallback = await query('SELECT * FROM task_posts ORDER BY id DESC LIMIT 3')
      return res.json({ code: 200, message: '查询成功', data: fallback.map(mapTask) })
    }

    const behaviorRows = await query(
      `SELECT tags_json FROM user_behaviors
       WHERE user_id = ? AND target_type = 'task'
       ORDER BY id DESC LIMIT 100`,
      [userId]
    )

    const weightMap = {}
    for (const row of behaviorRows) {
      const tags = safeParseJson(row.tags_json, [])
      for (const tag of tags) {
        weightMap[tag] = (weightMap[tag] || 0) + 1
      }
    }

    const taskRows = await query('SELECT * FROM task_posts ORDER BY id DESC LIMIT 50')
    if (!Object.keys(weightMap).length) {
      return res.json({ code: 200, message: '查询成功', data: taskRows.slice(0, 3).map(mapTask) })
    }

    const scored = taskRows
      .map((task) => {
        const tags = safeParseJson(task.tags_json, [])
        const score = tags.reduce((sum, tag) => sum + (weightMap[tag] || 0), 0)
        return { score, task }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((item) => mapTask(item.task))

    return res.json({ code: 200, message: '查询成功', data: scored })
  } catch (error) {
    return next(error)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const payload = req.body || {}
    if (!payload.title || !payload.location) {
      return res.status(400).json({ code: 400, message: '任务标题和地点必填', data: null })
    }

    const ownerId = Number(payload.publisherId || 1)
    const userRows = await query('SELECT id, nickname FROM users WHERE id = ? LIMIT 1', [ownerId])
    if (!userRows.length) {
      return res.status(400).json({ code: 400, message: '发布用户不存在', data: null })
    }

    const result = await query(
      `INSERT INTO task_posts
      (owner_id, owner_name, title, description, reward_amount, location_text, due_time, tags_json, images_json, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        ownerId,
        payload.publisher || userRows[0].nickname,
        payload.title,
        payload.description || '',
        Number(payload.reward || 0),
        payload.location,
        payload.deadline || null,
        JSON.stringify(payload.tags || []),
        JSON.stringify(payload.images || [])
      ]
    )

    const rows = await query('SELECT * FROM task_posts WHERE id = ? LIMIT 1', [result.insertId])
    return res.json({ code: 200, message: '创建成功', data: mapTask(rows[0]) })
  } catch (error) {
    return next(error)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const rows = await query('SELECT * FROM task_posts WHERE id = ? LIMIT 1', [id])
    if (!rows.length) {
      return res.status(404).json({ code: 404, message: '任务不存在', data: null })
    }
    return res.json({ code: 200, message: '查询成功', data: mapTask(rows[0]) })
  } catch (error) {
    return next(error)
  }
})

router.post('/:id/apply', async (req, res, next) => {
  try {
    const taskId = Number(req.params.id)
    const helperId = Number(req.body?.helperId || 0)
    if (!helperId) {
      return res.status(400).json({ code: 400, message: 'helperId 必填', data: null })
    }

    const helperRows = await query('SELECT id, nickname FROM users WHERE id = ? LIMIT 1', [helperId])
    if (!helperRows.length) {
      return res.status(400).json({ code: 400, message: '接单用户不存在', data: null })
    }

    const result = await query(
      `UPDATE task_posts
       SET status = 'ongoing', helper_id = ?, helper_name = ?
       WHERE id = ? AND status = 'pending'`,
      [helperId, helperRows[0].nickname, taskId]
    )

    if (!result.affectedRows) {
      return res.status(409).json({ code: 409, message: '任务当前不可接单', data: null })
    }

    const rows = await query('SELECT * FROM task_posts WHERE id = ? LIMIT 1', [taskId])
    return res.json({ code: 200, message: '接单成功', data: mapTask(rows[0]) })
  } catch (error) {
    return next(error)
  }
})

router.patch('/:id/status', async (req, res, next) => {
  try {
    const taskId = Number(req.params.id)
    const status = req.body?.status
    const allow = ['pending', 'ongoing', 'pending_confirm', 'completed', 'cancelled']
    if (!allow.includes(status)) {
      return res.status(400).json({ code: 400, message: '不支持的状态值', data: null })
    }

    const result = await query('UPDATE task_posts SET status = ? WHERE id = ?', [status, taskId])
    if (!result.affectedRows) {
      return res.status(404).json({ code: 404, message: '任务不存在', data: null })
    }
    const rows = await query('SELECT * FROM task_posts WHERE id = ? LIMIT 1', [taskId])
    return res.json({ code: 200, message: '状态更新成功', data: mapTask(rows[0]) })
  } catch (error) {
    return next(error)
  }
})

router.post('/:id/evaluate', async (req, res, next) => {
  const conn = await pool.getConnection()
  try {
    const taskId = Number(req.params.id)
    const fromUserId = Number(req.body?.fromUserId || req.body?.publisherId || 1)
    const toUserId = Number(req.body?.toUserId || 0)
    const rating = req.body?.rating
    const scoreMap = { good: 2, neutral: 0, bad: -2 }
    const creditChange = scoreMap[rating]

    if (!toUserId || creditChange === undefined) {
      return res.status(400).json({ code: 400, message: 'toUserId 和 rating 必填', data: null })
    }

    await conn.beginTransaction()
    await conn.execute(
      `INSERT INTO task_evaluations (task_id, from_user_id, to_user_id, rating, comment, credit_change)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment), credit_change = VALUES(credit_change)`,
      [taskId, fromUserId, toUserId, rating, req.body?.comment || '', creditChange]
    )
    await conn.execute(
      'UPDATE users SET credit_score = LEAST(100, GREATEST(0, credit_score + ?)) WHERE id = ?',
      [creditChange, toUserId]
    )
    await conn.execute(
      `INSERT INTO credit_logs (user_id, change_value, reason, source_type, source_id)
       VALUES (?, ?, ?, 'task_evaluation', ?)`,
      [toUserId, creditChange, `任务#${taskId}评价(${rating})`, taskId]
    )
    await conn.commit()

    return res.json({
      code: 200,
      message: '评价成功',
      data: { taskId, fromUserId, toUserId, rating, creditChange }
    })
  } catch (error) {
    await conn.rollback()
    return next(error)
  } finally {
    conn.release()
  }
})

module.exports = router
