import { fileURLToPath } from 'node:url';

/**
 * The Expo app at the repo root has its own lockfile, so Next infers that
 * directory as the workspace root and warns. This landing page is standalone —
 * it shares no dependencies with the app — so pin the root here.
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: fileURLToPath(new URL('.', import.meta.url)),
  },
};

export default nextConfig;
