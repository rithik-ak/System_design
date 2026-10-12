function notFound(req, res) {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
}
function errorHandler(err, req, res, next) {
  if (err.name === 'ValidationError' || err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid request', message: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: 'Internal server error' });
}
module.exports = { notFound, errorHandler };
