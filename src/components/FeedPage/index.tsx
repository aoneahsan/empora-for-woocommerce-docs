import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import type { FeedPost } from '@site/plugins/site-pages';
import styles from './styles.module.css';

/** Static files live in build/, not the route table, so they are linked absolutely. */
const SITE_URL = 'https://empora-docs.aoneahsan.com';

const FEEDS = [
  { href: `${SITE_URL}/feed.xml`, label: '/feed.xml', hint: 'RSS 2.0 — paste this address into any feed reader.' },
  { href: `${SITE_URL}/changelog/atom.xml`, label: '/changelog/atom.xml', hint: 'the same releases as an Atom feed.' },
  { href: `${SITE_URL}/changelog/feed.json`, label: '/changelog/feed.json', hint: 'the same releases as JSON Feed.' },
];

/** Formats a YYYY-MM-DD date for display, in UTC so the day never shifts. */
function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * The readable feed: every changelog post, newest first, with the feed files at the top.
 * Its data comes from the site-pages plugin, so it is prerendered and needs no script.
 */
export default function FeedPage({ posts }: { posts: FeedPost[] }): React.JSX.Element {
  return (
    <Layout
      title="Feed"
      description="Every Empora for WooCommerce release note, newest first, with the RSS, Atom and JSON feeds to subscribe to."
    >
      <main className="container margin-vert--lg">
        <h1>Feed</h1>
        <p className={styles.lede}>
          Every release note for Empora for WooCommerce, newest first. Subscribe to a feed below to hear
          about new versions without checking back.
        </p>

        <div className={styles.machine}>
          <h2 className={styles.machineHeading}>Subscribe</h2>
          <ul>
            {FEEDS.map((f) => (
              <li key={f.href}>
                <a href={f.href}>
                  <code>{f.label}</code>
                </a>{' '}
                — {f.hint}
              </li>
            ))}
          </ul>
        </div>

        <h2>Releases ({posts.length})</h2>
        <ul className={styles.posts}>
          {posts.map((post) => (
            <li key={post.permalink} className={styles.post}>
              <p className={styles.date}>
                <time dateTime={post.date}>{formatDate(post.date)}</time>
              </p>
              <h3 className={styles.postTitle}>
                <Link to={post.permalink}>{post.title}</Link>
              </h3>
              <p className={styles.postDesc}>{post.description}</p>
              <p className={styles.tags}>
                {post.tags.map((t) => (
                  <Link key={t.permalink} to={t.permalink} className={styles.tag}>
                    {t.label}
                  </Link>
                ))}
              </p>
            </li>
          ))}
        </ul>
      </main>
    </Layout>
  );
}
