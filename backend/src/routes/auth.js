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
  passport.authenticate('google', { session: true, failureRedirect: `${config.frontendUrl}/?error=auth` }),
  (req, res) => {
    res.redirect(`${config.frontendUrl}/dashboard`);
  }
);

router.post('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.json({ ok: true });
  });
});

export default router;
