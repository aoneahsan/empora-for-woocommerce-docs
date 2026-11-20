/**
 * Every place Empora is released — the ONLY place a store or surface URL lives in this docs site
 * (standard aoneahsan-cccs-platform-links). Each surface passed its release proof on `verified`:
 * the dashboard and this site answered 200. The WordPress.org listing is not live yet (2026-11-20), so it is not listed.
 */
export type PlatformId = 'web' | 'docs';

export interface Platform {
  id: PlatformId;
  /** Store or surface name (a proper name, not copy). */
  name: string;
  href: string;
  /** What this surface is for, in Empora's words. */
  title: string;
  text: string;
  cta: string;
  primary?: boolean;
  verified: string;
}

export const PLATFORMS: readonly Platform[] = [
  {id: 'web', name: 'Empora dashboard', href: 'https://empora.aoneahsan.com', title: 'Your Empora account', text: 'Plans, licences and the modules you switch on for your WooCommerce store, in one dashboard.', cta: 'Open Empora', primary: true, verified: '2026-11-20'},
  {id: 'docs', name: 'Documentation', href: 'https://empora-docs.aoneahsan.com', title: 'These docs', text: 'Installation, a quick start, and a page for each of the 82 modules.', cta: 'Read the docs', verified: '2026-11-20'},
];

export const APPS_PAGE = {
  title: 'Get Empora',
  description: 'Every place Empora is released: the dashboard and these docs.',
  lead: 'Run your Empora plan from the dashboard, and keep these docs a tab away while you set up your store.',
} as const;

/** This site is the docs surface. */
export const CURRENT_SURFACE: PlatformId = 'docs';
export const OTHER_PLATFORMS: readonly Platform[] = PLATFORMS.filter((platform) => platform.id !== CURRENT_SURFACE);
export const PRIMARY_PLATFORM: Platform = PLATFORMS.find((platform) => platform.primary) ?? PLATFORMS[0];
export function platformHref(id: PlatformId): string {
  const found = PLATFORMS.find((platform) => platform.id === id);
  if (!found) throw new Error(`Unknown platform: ${id}`);
  return found.href;
}
/** `/apps` changes only when this list does: its sitemap date is the newest proof date. */
export const APPS_LASTMOD: string = PLATFORMS.map((platform) => platform.verified).sort().at(-1) ?? '2026-11-20';
