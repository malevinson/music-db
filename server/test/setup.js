// Global safety net for server tests: nothing here may touch real services.
import { vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';

// Never load the developer's real .env (DB URI, Spotify keys, SMTP credentials).
vi.mock('dotenv', () => {
  const config = vi.fn(() => ({ parsed: {} }));
  return { default: { config }, config };
});

// Silence per-request access logs.
vi.mock('morgan', () => ({ default: () => (req, res, next) => next() }));

// Fixed, fake configuration.
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017';
process.env.SPOTIFY_CLIENT_ID = 'test-client-id';
process.env.SPOTIFY_CLIENT_SECRET = 'test-client-secret';
for (const key of [
  'NOTIFICATION_EMAIL', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM', 'SMTP_SECURE',
  'SLACK_WEBHOOK_URL', 'DISCORD_WEBHOOK_URL', 'CUSTOM_WEBHOOK_URL',
]) {
  delete process.env[key];
}

// Quiet logs from module-level startup code too (beforeEach below re-applies per test).
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

// No database connections.
vi.spyOn(mongoose, 'connect').mockResolvedValue(mongoose);

// No outbound HTTP unless a test explicitly stubs fetch.
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('Network access is disabled in tests'))));
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
