import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { config } from '../config/index.js';
import { prisma } from './prisma.js';

export function setupPassport(app) {
  const callbackURL = `${config.backendUrl}/auth/google/callback`;
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.google.clientId,
        clientSecret: config.google.clientSecret,
        callbackURL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const name = profile.displayName;
          const avatar = profile.photos?.[0]?.value;
          if (!email) return done(new Error('No email from Google'));
          let user = await prisma.user.findUnique({ where: { email } });
          if (!user) {
            user = await prisma.user.create({
              data: { email, name, avatar, templateCredits: 10, voiceCredits: 5 },
            });
          } else {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { name: name || user.name, avatar: avatar || user.avatar },
            });
          }
          return done(null, {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            templateCredits: user.templateCredits,
            voiceCredits: user.voiceCredits,
          });
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          templateCredits: true,
          voiceCredits: true,
        },
      });
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.use(passport.initialize());
  app.use(passport.session());
}
