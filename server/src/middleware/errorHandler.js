module.exports = (error, req, res, next) => {
  const statusCode = error.statusCode || 500
  const message = error.message || 'Something went wrong.'

  if (process.env.NODE_ENV !== 'production') {
    console.error(error)
  }

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
  })
}
