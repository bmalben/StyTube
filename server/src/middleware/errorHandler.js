module.exports = (error, req, res, next) => {
  const statusCode = error.statusCode || 500
  const message = error.message || 'Something went wrong.'

  if (process.env.NODE_ENV !== 'production') {
    console.error(error)
  }

  const payload = {
    error: {
      code: error.code || 'SERVER_ERROR',
      message,
      ...(error.fields ? { fields: error.fields } : {}),
    },
  }

  if (process.env.NODE_ENV !== 'production') {
    payload.error.stack = error.stack
  }

  res.status(statusCode).json(payload)
}
