export function requireAuth(req, res, next) {
  if (!req.isAuthenticated || !req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}
