import { defineConfig } from 'vitest/config';

// Optional richer harness. The zero-install fallback (`node tools/run-tests.mjs`)
// runs the same *.test.ts files under Node's built-in runner with no install.
export default defineConfig({
  test: {
    include: ['app/src/**/*.test.ts'],
    environment: 'node',
  },
});
