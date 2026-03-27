import { verifyAuthToken } from '../utils/jwt.js';
import { prisma } from '../utils/prisma.js';

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (token) {
    try {
      const payload = verifyAuthToken(token);
      return prisma.user
        .findUnique({
          where: { id: payload.sub },
          select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            credits: true,
          },
        })
        .then((user) => {
          if (!user) return res.status(401).json({ error: 'Not authenticated' });
          req.user = user;
          return next();
        })
        .catch(() => res.status(401).json({ error: 'Not authenticated' }));
    } catch (_) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
  }

  if (!req.isAuthenticated || !req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}
