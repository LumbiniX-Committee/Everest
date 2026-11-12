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
  /*
   * The app's map runs in a WebView document with no web origin of its own,
   * so it can load the walking figure and the monument models only if these
   * files allow any origin. They are public, static and versioned by name.
   */
  async headers() {
    const shared = [
      { key: 'Access-Control-Allow-Origin', value: '*' },
      { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
    ];
    return [
      { source: '/characters/:path*', headers: shared },
      { source: '/models/:path*', headers: shared },
    ];
  },
};

export default nextConfig;
