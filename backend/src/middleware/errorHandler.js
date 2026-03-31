function notFoundHandler(req, res) {
  res.status(404).json({ code: 404, message: `Not Found: ${req.originalUrl}`, data: null })
}

function errorHandler(err, req, res, next) {
  const status = err.status || 500
  res.status(status).json({ code: status, message: err.message || 'Internal Server Error', data: null })
}

module.exports = { notFoundHandler, errorHandler }
