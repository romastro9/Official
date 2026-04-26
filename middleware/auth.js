function requireAuth(req, res, next) {
  if (req.session?.admin) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

module.exports = { requireAuth };
