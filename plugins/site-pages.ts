import { execFileSync } from 'node:child_process';
import type { LoadContext, Plugin } from '@docusaurus/types';

/**
 * The readable /feed page and the /feed.xml copy of the changelog RSS.
 *
 * `/feed` is added as an exact route with the changelog posts as its data
 * module, so it is prerendered and lands in sitemap.xml like any other page.
 * `/feed.xml` is written in `postBuild` from `changelog/rss.xml` after the
 * self-link plugin has patched it.
 */

/** One post as the /feed page renders it. */
export type FeedPost = {
  title: string;
  description: string;
  permalink: string;
  date: string;
  tags: { label: string; permalink: string }[];
};

type BlogContent = {
  blogPosts: {
    metadata: {
      title: string;
      description: string;
      permalink: string;
      date: string | Date;
      tags: { label: string; permalink: string }[];
    };
  }[];
};

/** Reads a file, polling, because every plugin's postBuild runs at once. */
async function waitForFile(file: string, mustInclude: string): Promise<string> {
  const fs = await import('node:fs/promises');
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const text = await fs.readFile(file, 'utf8');
      if (text.includes(mustInclude)) return text;
    } catch {
      // not written yet
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`site-pages: ${file} did not appear (with "${mustInclude}") within 30s.`);
}

export default function sitePagesPlugin(context: LoadContext): Plugin {
  return {
    name: 'site-pages',
    async allContentLoaded({ allContent, actions }) {
      const blog = allContent['docusaurus-plugin-content-blog']?.default as BlogContent | undefined;
      if (!blog) throw new Error('site-pages: the changelog blog plugin is not loaded.');

      const posts: FeedPost[] = blog.blogPosts.map(({ metadata }) => ({
        title: metadata.title,
        description: metadata.description,
        permalink: metadata.permalink,
        date: new Date(metadata.date).toISOString().slice(0, 10),
        tags: metadata.tags.map((t) => ({ label: t.label, permalink: t.permalink })),
      }));

      const untagged = posts.filter((p) => p.tags.length === 0);
      if (untagged.length > 0) {
        throw new Error(
          `site-pages: every changelog post needs a tag so its feed item carries a <category>. Untagged: ${untagged
            .map((p) => p.permalink)
            .join(', ')}`,
        );
      }

      const postsPath = await actions.createData('feed-posts.json', JSON.stringify(posts));
      actions.addRoute({
        path: '/feed',
        component: '@site/src/components/FeedPage/index.tsx',
        exact: true,
        modules: { posts: postsPath },
      });
    },
    async postBuild({ outDir }) {
      const fs = await import('node:fs/promises');
      const path = await import('node:path');
      const rss = await waitForFile(path.join(outDir, 'changelog', 'rss.xml'), 'rel="self"');
      const feedXml = rss.replace(
        `${context.siteConfig.url}/changelog/rss.xml" rel="self"`,
        `${context.siteConfig.url}/feed.xml" rel="self"`,
      );
      if (!feedXml.includes('/feed.xml" rel="self"')) {
        throw new Error('site-pages: could not point the feed.xml self link at /feed.xml.');
      }
      if (!feedXml.includes('<category>')) {
        throw new Error('site-pages: feed.xml has no <category> on its items.');
      }
      await fs.writeFile(path.join(outDir, 'feed.xml'), feedXml, 'utf8');
    },
  };
}

/** The last commit date (YYYY-MM-DD) of the given paths, or null when none is committed. */
export function gitDate(siteDir: string, paths: string[]): string | null {
  const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', ...paths], {
    cwd: siteDir,
    encoding: 'utf8',
  }).trim();
  return out || null;
}
