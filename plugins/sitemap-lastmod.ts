import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import type { Options as SitemapOptions } from '@docusaurus/plugin-sitemap';
import { gitDate } from './site-pages';

type CreateSitemapItems = NonNullable<SitemapOptions['createSitemapItems']>;

/**
 * Gives every sitemap URL a truthful lastmod.
 *
 * Docs and posts already carry their git date (`lastmod: 'date'`). The rest
 * are filled from what each page lists:
 * - a changelog tag page takes the newest post carrying that tag;
 * - the changelog list, archive, authors, tags index and /feed take the newest post;
 * - the home page takes the last commit of its own source;
 * - /sitemap takes the newest date of every page.
 * Any URL still undated fails the build rather than shipping without a date.
 * The build must run from a full git checkout (the deploy uses fetch-depth: 0).
 */
export const createSitemapItems: CreateSitemapItems = async ({ defaultCreateSitemapItems, ...rest }) => {
  const items = await defaultCreateSitemapItems(rest);
  const site = rest.siteConfig.url;
  const siteDir = process.cwd();
  const newest = (dates: (string | null | undefined)[]): string | null =>
    dates.filter((d): d is string => Boolean(d)).sort().at(-1) ?? null;

  // post permalink -> tag slugs, from each post's own front matter.
  const changelogDir = path.join(siteDir, 'changelog');
  const postTags = new Map<string, string[]>();
  for (const file of readdirSync(changelogDir).filter((f) => /\.mdx?$/.test(f))) {
    const fm = readFileSync(path.join(changelogDir, file), 'utf8').split(/^---$/m)[1] ?? '';
    const slug = /^slug:\s*(.+)$/m.exec(fm)?.[1]?.trim();
    const tags = /^tags:\s*\[(.*)\]$/m.exec(fm)?.[1]?.split(',').map((t) => t.trim()) ?? [];
    if (slug) postTags.set(`${site}/changelog/${slug}`, tags);
  }

  const postItems = items.filter((i) => postTags.has(i.url));
  const newestPost = newest(postItems.map((i) => i.lastmod));

  for (const item of items) {
    if (item.lastmod) continue;
    const tagMatch = new RegExp(`^${site}/changelog/tags/([^/]+)$`).exec(item.url);
    if (tagMatch) {
      item.lastmod = newest(postItems.filter((p) => postTags.get(p.url)?.includes(tagMatch[1])).map((p) => p.lastmod));
    } else if (item.url === `${site}/changelog` || item.url.startsWith(`${site}/changelog/`) || item.url === `${site}/feed`) {
      item.lastmod = newestPost;
    } else if (item.url === `${site}/`) {
      item.lastmod = gitDate(siteDir, ['src/pages/index.tsx', 'src/pages/index.module.css']);
    }
  }

  const sitemapPage = items.find((i) => i.url === `${site}/sitemap`);
  if (sitemapPage) sitemapPage.lastmod = newest(items.map((i) => i.lastmod));

  const undated = items.filter((i) => !i.lastmod).map((i) => i.url);
  if (undated.length > 0) {
    throw new Error(`sitemap-lastmod: ${undated.length} URL(s) have no lastmod:\n  ${undated.join('\n  ')}`);
  }
  return items;
};
