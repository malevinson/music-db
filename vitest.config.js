import { defineConfig } from 'vitest/config';

// Server-side unit tests (Express API, models, Netlify function, build scripts).
// The React client has its own suite in react-ui/ (run with `npm run test:client`).
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['server/**/*.test.js', 'netlify/**/*.test.js', 'scripts/**/*.test.js'],
    setupFiles: ['./server/test/setup.js'],
    clearMocks: true,
    unstubEnvs: true,
    coverage: {
      include: ['server/**/*.js', 'netlify/**/*.js', 'scripts/**/*.js', 'Artist.js', 'User.js'],
      exclude: ['**/*.test.js', 'server/test/**', 'server/server-local.js'],
    },
  },
});
