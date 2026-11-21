import { defineConfig } from 'vitest/config';

// Unit tests for the React client.
// CRA 1.x can't run modern tests, so the client uses Vitest + jsdom instead of `react-scripts test`.
export default defineConfig({
  esbuild: {
    // The app keeps JSX in plain .js files
    loader: 'jsx',
    include: /src\/.*\.js$/,
    exclude: [],
    jsx: 'transform', // classic React.createElement — the locked React (16.6) has no automatic runtime
  },
  resolve: {
    // Some UI deps (react-hover-image, react-sortable-hoc) live in the root node_modules;
    // make sure everything shares this package's single copy of React.
    dedupe: ['react', 'react-dom'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.js'],
    css: false,
    restoreMocks: true,
    coverage: {
      include: ['src/**/*.js'],
      exclude: ['src/**/*.test.js', 'src/test/**'],
    },
    server: {
      deps: {
        inline: ['react-sortable-hoc'],
      },
    },
  },
});
