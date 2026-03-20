export function getCurrentUser(req, res, next) {
  if (!req.isAuthenticated || !req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({
    id: req.user.id,
    email: req.user.email,
    name: req.user.name,
    avatar: req.user.avatar,
    templateCredits: req.user.templateCredits,
    voiceCredits: req.user.voiceCredits,
  });
}
