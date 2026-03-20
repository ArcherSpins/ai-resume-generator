import { Router } from 'express';
import passport from 'passport';
import { config } from '../config/index.js';

const router = Router();

const callbackURL = `${config.backendUrl}/auth/google/callback`;

router.get(
  '/google',
  (req, res, next) => {
    console.log('OAuth: redirect_uri sent to Google:', callbackURL);
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      callbackURL,
    })(req, res, next);
  }
);

router.get(
  '/google/callback',
  (req, res, next) => {
    passport.authenticate('google', { session: true }, (err, user, info) => {
      if (err || !user) {
        const ua = req.get('user-agent') || 'unknown';
        const ip = req.ip || req.connection?.remoteAddress || 'unknown';
        console.error('[OAuth callback] Authentication failed', {
          error: err?.message || null,
          errorCode: err?.code || null,
          info,
          ip,
          userAgent: ua,
        });
        return res.redirect(`${config.frontendUrl}/?error=auth`);
      }

      req.logIn(user, (loginErr) => {
        if (loginErr) {
          const ua = req.get('user-agent') || 'unknown';
          const ip = req.ip || req.connection?.remoteAddress || 'unknown';
          console.error('[OAuth callback] Session login failed', {
            error: loginErr?.message || null,
            errorCode: loginErr?.code || null,
            ip,
            userAgent: ua,
          });
          return next(loginErr);
        }
        return res.redirect(`${config.frontendUrl}/dashboard`);
      });
    })(req, res, next);
  }
);

router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.json({ ok: true });
  });
});

export default router;
