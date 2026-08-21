import rateLimit from 'express-rate-limit';
import { config } from '../config';

export const globalRateLimit = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  message: { error: 'Te veel verzoeken, probeer later opnieuw' },
  standardHeaders: true,
  legacyHeaders: false
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: config.authRateLimitMax,
  message: { error: 'Te veel inlogpogingen, probeer over 15 minuten opnieuw' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});
