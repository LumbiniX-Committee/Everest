// Fails on navigation that would strand someone: a link to a route that doesn't
// exist, or a pushed screen with no visible way back. Static, so it runs on every
// verify, and it covers paths built from strings that typed routes can't check.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.tsx?$/.test(name)) out.push(path);
  }
  return out;
}

const routeFiles = walk(join(root, 'app')).filter((file) => !file.endsWith('_layout.tsx'));
const routes = new Set(
  routeFiles.map((file) =>
    `/${relative(join(root, 'app'), file)}`.replace(/\.tsx?$/, '').replace(/\/index$/, '') || '/',
  ),
);
routes.add('/');

/** `/(main)/tirtha/site/abc` matches `/(main)/tirtha/site/[siteId]`. */
function resolves(path) {
  const clean = path.split('?')[0].replace(/\/$/, '') || '/';
  if (routes.has(clean)) return true;
  const parts = clean.split('/');
  return [...routes].some((route) => {
    const candidate = route.split('/');
    return (
      candidate.length === parts.length &&
      candidate.every((part, i) => part === parts[i] || /^\[.+\]$/.test(part))
    );
  });
}

const failures = [];
const sources = [...walk(join(root, 'features')), ...walk(join(root, 'components')), ...walk(join(root, 'hooks')), ...walk(join(root, 'app'))];
const LINK = /(?:pathname:\s*|router\.(?:push|replace|navigate|dismissTo)\(\s*|openInTabs\(\s*|href=)[`'"]((?:\/\(main\)|\/visit|\/onboarding)[^`'"]*)[`'"]/g;
let checked = 0;

for (const file of sources) {
  const text = readFileSync(file, 'utf8');
  for (const match of text.matchAll(LINK)) {
    checked += 1;
    // Interpolated ids stand in for a dynamic segment.
    const path = match[1].replace(/\$\{[^}]+\}/g, 'x');
    if (!resolves(path)) failures.push(`${relative(root, file)}: no route for ${match[1]}`);
  }
  // A bare back call does nothing on a screen opened cold from a deep link.
  if (/router\.back\(\)/.test(text) && !file.endsWith('useNavigationFlow.ts') && !file.endsWith('OnboardingFrame.tsx')) {
    failures.push(`${relative(root, file)}: use useSafeBack rather than router.back()`);
  }
}

// Every pushed feature screen must show a way back.
const ROUTES_NEEDING_BACK = [
  'features/tirtha/SiteDetailScreen.tsx',
  'features/tirtha/ThenNowScreen.tsx',
  'features/sakshi/VantageScreen.tsx',
  'features/sakshi/ObservationScreen.tsx',
  'features/chaityavali/SiteHistoryScreen.tsx',
  'features/dhamma/ReflectionScreen.tsx',
];
for (const file of ROUTES_NEEDING_BACK) {
  if (!readFileSync(join(root, file), 'utf8').includes('<BackBar')) {
    failures.push(`${file}: pushed screen has no visible back control`);
  }
}

if (failures.length > 0) {
  console.error(`navigation check failed:\n  ${failures.join('\n  ')}`);
  process.exit(1);
}
console.log(`navigation: ${checked} links resolve across ${routes.size} routes; every pushed screen has a way back`);
