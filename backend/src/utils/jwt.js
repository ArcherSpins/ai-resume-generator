import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

const EXPIRES_IN = '7d';

export function signAuthToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
    },
    config.jwtSecret,
    { expiresIn: EXPIRES_IN }
  );
}

export function verifyAuthToken(token) {
  return jwt.verify(token, config.jwtSecret);
}
