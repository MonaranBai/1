const express = require('express')
const { query } = require('../db/mysql')

const router = express.Router()

router.post('/', async (req, res, next) => {
  try {
    const { postId, reason, reporter, reporterId } = req.body || {}
    if (!postId || !reason) {
      return res.status(400).json({ code: 400, message: 'postId 和 reason 必填', data: null })
    }

    const postRows = await query('SELECT id FROM info_posts WHERE id = ? LIMIT 1', [Number(postId)])
    if (!postRows.length) {
      return res.status(404).json({ code: 404, message: '帖子不存在', data: null })
    }

    const result = await query(
      `INSERT INTO post_reports (post_id, reporter_id, reporter_name, reason, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      [Number(postId), reporterId ? Number(reporterId) : null, reporter || '游客', reason]
    )

    return res.json({
      code: 200,
      message: '举报提交成功',
      data: { id: result.insertId, postId: Number(postId), reason }
    })
  } catch (error) {
    return next(error)
  }
})

module.exports = router
