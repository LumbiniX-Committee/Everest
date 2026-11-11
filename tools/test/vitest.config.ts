// vitest is an optional harness and is not installed by default, hence the resolver rule.
// eslint-disable-next-line import/no-unresolved
import { defineConfig } from 'vitest/config';

// Optional richer harness. The zero-install fallback (`node tools/run-tests.mjs`)
// runs the same *.test.ts files under Node's built-in runner with no install.
export default defineConfig({
  test: {
    include: ['core/**/*.test.ts'],
    environment: 'node',
  },
});
