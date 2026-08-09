/**
 * Latest Android APK, read from EAS at request time.
 *
 * The download link and version string used to be hardcoded. Nothing errored
 * when they went stale — the page just kept serving an older build — so the
 * failure was invisible. Reading EAS directly removes the chance to forget.
 */

const EAS_GRAPHQL = 'https://api.expo.dev/graphql';

/**
 * From app.json, extra.eas.projectId.
 *
 * Moved from the `siddantasodari` project (e8454679-…) to `siddantasodari-2`
 * on 2026-08-10: the original account exhausted its free-plan Android builds
 * for the month, so new APKs are built under a second account. This must stay
 * in step with app.json — pointing at a project with no finished preview build
 * silently serves the pinned fallback instead.
 */
const PROJECT_ID = 'b41eee97-484c-4afd-b664-fa65fca50e66';

/**
 * Only the `preview` profile is eligible. `production` builds an app-bundle
 * (.aab), which Android cannot sideload — serving one from the download button
 * would hand visitors a file their phone silently refuses to open.
 */
const APK_BUILD_PROFILE = 'preview';

/** How long a resolved build is served before EAS is consulted again. */
export const REVALIDATE_SECONDS = 300;

export type LatestBuild = {
  version: string;
  buildNumber: string | null;
  apkUrl: string;
  completedAt: string | null;
  /** True when EAS could not be reached and the pinned build is being served. */
  isFallback: boolean;
};

/**
 * Served when EAS is unreachable, the token is missing, or the query returns
 * nothing usable. A stale-but-working download beats a broken page mid-demo,
 * so every failure path lands here rather than throwing.
 */
const FALLBACK: LatestBuild = {
  version: '0.1.0',
  buildNumber: '1',
  apkUrl:
    'https://expo.dev/artifacts/eas/0DPfxsZpqdCXwTXJrO_JpUsT0AYp0yPMG-oGPFfHjKc.apk',
  completedAt: '2026-08-09T19:53:01.715Z',
  isFallback: true,
};

/**
 * Visitors are deliberately shown no difference — a warning banner on a
 * download page costs trust and tells them nothing they can act on. The signal
 * belongs in the server log, where whoever is on the hook for the demo can find
 * out *why* the page is pinned instead of guessing.
 */
function fallback(reason: string): LatestBuild {
  console.warn(`[eas] serving pinned build — ${reason}`);
  return FALLBACK;
}

const QUERY = `
  query LatestAndroidApk($appId: String!, $profile: String!) {
    app {
      byId(appId: $appId) {
        builds(
          limit: 1
          offset: 0
          filter: { platform: ANDROID, status: FINISHED, buildProfile: $profile }
        ) {
          appVersion
          appBuildVersion
          completedAt
          artifacts {
            applicationArchiveUrl
          }
        }
      }
    }
  }
`;

type BuildNode = {
  appVersion: string | null;
  appBuildVersion: string | null;
  completedAt: string | null;
  artifacts: { applicationArchiveUrl: string | null } | null;
};

export async function getLatestBuild(): Promise<LatestBuild> {
  const token = process.env.EXPO_TOKEN;

  // Not an error worth crashing on: local `next dev` without a token should
  // still render a working page.
  if (!token) return fallback('EXPO_TOKEN is not set');

  try {
    const res = await fetch(EAS_GRAPHQL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: QUERY,
        variables: { appId: PROJECT_ID, profile: APK_BUILD_PROFILE },
      }),
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (!res.ok) return fallback(`EAS responded ${res.status}`);

    const json = await res.json();

    // GraphQL reports auth and validation failures as 200 + an errors array,
    // so a bad token looks like success until this is checked.
    if (json.errors?.length)
      return fallback(`GraphQL error: ${json.errors[0]?.message ?? 'unknown'}`);

    const build: BuildNode | undefined = json.data?.app?.byId?.builds?.[0];
    const url = build?.artifacts?.applicationArchiveUrl;

    // Guard the extension as well as the profile filter. If someone ever points
    // the preview profile at an app-bundle, this keeps an unsideloadable .aab
    // off the download button.
    if (!url) return fallback('no finished Android preview build found');
    if (!url.endsWith('.apk'))
      return fallback(`latest artifact is not an APK: ${url}`);

    return {
      version: build?.appVersion ?? FALLBACK.version,
      buildNumber: build?.appBuildVersion ?? null,
      apkUrl: url,
      completedAt: build?.completedAt ?? null,
      isFallback: false,
    };
  } catch (err) {
    return fallback(`request failed: ${err instanceof Error ? err.message : err}`);
  }
}

export function formatBuildDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
