import React, { useMemo, useState } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import styles from './sitemap.module.css';

/** Static files live in build/, not the route table, so they are linked absolutely. */
const SITE_URL = 'https://empora-docs.aoneahsan.com';

/**
 * The human-readable sitemap: every public page on this site, grouped, searchable,
 * and linking the machine-readable artefacts at the top.
 */

type Entry = {
  to: string;
  title: string;
  description: string;
  tags: string[];
};

type Group = {
  name: string;
  blurb: string;
  entries: Entry[];
};

const GROUPS: Group[] = [
  {
    name: 'Getting started',
    blurb: 'Install the plugin, switch on your first module, and unlock the premium ones.',
    entries: [
      {
        to: '/intro',
        title: 'Introduction',
        description: 'What Empora is, who it is for, and how the plugin, site and API fit together.',
        tags: ['overview', 'about', 'start here'],
      },
      {
        to: '/getting-started/installation',
        title: 'Installation',
        description: 'Requirements and the ZIP upload install, plus what happens on activation.',
        tags: ['install', 'setup', 'zip', 'requirements'],
      },
      {
        to: '/getting-started/quick-start',
        title: 'Quick start',
        description: 'Enable and configure your first module in about five minutes.',
        tags: ['quick start', 'first steps', 'tutorial'],
      },
      {
        to: '/getting-started/activating-your-license',
        title: 'Activating your license',
        description: 'Enter a key, unlock premium modules, and manage which sites use a seat.',
        tags: ['license', 'activation', 'key', 'sites'],
      },
    ],
  },
  {
    name: 'Modules',
    blurb: 'The 78 modules: what exists, what each plan unlocks, and how to switch them on.',
    entries: [
      {
        to: '/modules/overview',
        title: 'Modules overview',
        description: 'How modules work and a tour of the catalogue by area.',
        tags: ['modules', 'features', 'catalogue'],
      },
      {
        to: '/modules/reference',
        title: 'Module reference',
        description: 'All 78 modules with search and filters, and the plan each one belongs to.',
        tags: ['module list', 'reference', 'search', 'plans'],
      },
      {
        to: '/modules/free-core',
        title: 'Free core modules',
        description: 'The seven modules that work forever without a license.',
        tags: ['free', 'core', 'no license'],
      },
      {
        to: '/modules/premium',
        title: 'Premium modules',
        description: 'The headline modules a paid plan unlocks, and what each is for.',
        tags: ['premium', 'paid', 'license'],
      },
      {
        to: '/modules/configuring-modules',
        title: 'Configuring modules',
        description: 'The Modules grid, the unified Settings page, and enabling safely.',
        tags: ['settings', 'configuration', 'enable', 'disable'],
      },
    ],
  },
  {
    name: 'Guides',
    blurb: 'Task-shaped walkthroughs for the modules people set up first.',
    entries: [
      {
        to: '/guides/product-filters',
        title: 'Product filters',
        description: 'Set up AJAX filtering on shop and category pages.',
        tags: ['filters', 'ajax', 'shop page', 'facets'],
      },
      {
        to: '/guides/reviews-wishlist-compare',
        title: 'Reviews, wishlist & compare',
        description: 'The three storefront modules that need no license and the least setup.',
        tags: ['reviews', 'wishlist', 'compare'],
      },
      {
        to: '/guides/dynamic-pricing',
        title: 'Dynamic pricing',
        description: 'Quantity discounts, percentage rules, and how rules resolve together.',
        tags: ['pricing', 'discounts', 'bulk', 'rules'],
      },
      {
        to: '/guides/gift-cards-and-rewards',
        title: 'Gift cards & rewards',
        description: 'Issuing gift cards and running a points programme.',
        tags: ['gift cards', 'vouchers', 'rewards', 'loyalty', 'points'],
      },
    ],
  },
  {
    name: 'Plans & help',
    blurb: 'What things cost, what to do when something breaks, and how to reach a human.',
    entries: [
      {
        to: '/pricing',
        title: 'Plans & pricing',
        description: 'The five tiers, their module counts, site counts and limits.',
        tags: ['pricing', 'plans', 'cost', 'license', 'free tier'],
      },
      {
        to: '/troubleshooting',
        title: 'Troubleshooting',
        description: 'Fixes for the failures that come up most, in diagnosis order.',
        tags: ['problems', 'errors', 'fix', 'debug', 'conflict'],
      },
      {
        to: '/faq',
        title: 'FAQ',
        description: 'Short answers to the questions asked most often.',
        tags: ['faq', 'questions', 'answers'],
      },
      {
        to: '/support',
        title: 'Support & contact',
        description: 'Where to write, what to include, and how to arrange a paid plan.',
        tags: ['support', 'contact', 'help', 'bug report'],
      },
      {
        to: '/changelog',
        title: 'Changelog',
        description: 'Release notes for every version, newest first.',
        tags: ['changelog', 'releases', 'versions', 'updates'],
      },
    ],
  },
  {
    name: 'Reference',
    blurb: 'The technical detail: versions, architecture, APIs and data handling.',
    entries: [
      {
        to: '/reference/requirements',
        title: 'Requirements & compatibility',
        description: 'Version floors, HPOS, hosting, multisite and browser support.',
        tags: ['requirements', 'php', 'wordpress', 'woocommerce', 'hpos'],
      },
      {
        to: '/reference/architecture',
        title: 'Architecture',
        description: 'How the plugin is put together and why modules load the way they do.',
        tags: ['architecture', 'internals', 'design', 'performance'],
      },
      {
        to: '/reference/rest-api',
        title: 'REST API',
        description: 'The plugin REST namespace, authentication and response shape.',
        tags: ['rest', 'api', 'endpoints', 'developers'],
      },
      {
        to: '/reference/license-api',
        title: 'License API',
        description: 'Activation, validation and deactivation against the license service.',
        tags: ['license api', 'activation', 'entitlements'],
      },
      {
        to: '/reference/privacy-and-data',
        title: 'Privacy & data handling',
        description: 'What data the plugin stores, what leaves the site, and what is removed.',
        tags: ['privacy', 'gdpr', 'data', 'external services'],
      },
      {
        to: '/about-the-author',
        title: 'About the author',
        description: 'Who builds and maintains Empora.',
        tags: ['author', 'about', 'ahsan mahmood'],
      },
    ],
  },
];

const ALL = GROUPS.flatMap((g) => g.entries);

function matches(entry: Entry, q: string): boolean {
  const haystack = `${entry.title} ${entry.description} ${entry.tags.join(' ')}`.toLowerCase();
  return q
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term));
}

export default function SitemapPage(): React.JSX.Element {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const groups = useMemo(() => {
    if (!q) return GROUPS;
    return GROUPS.map((g) => ({ ...g, entries: g.entries.filter((e) => matches(e, q)) })).filter(
      (g) => g.entries.length > 0,
    );
  }, [q]);

  const shown = groups.reduce((n, g) => n + g.entries.length, 0);

  return (
    <Layout
      title="Sitemap"
      description="Every page on the Empora for WooCommerce documentation site, grouped and searchable, plus the machine-readable sitemap and RSS feed."
    >
      <main className="container margin-vert--lg">
        <h1>Sitemap</h1>
        <p className={styles.lede}>
          Every page on this documentation site, grouped by what you are trying to do. {ALL.length}{' '}
          pages in total.
        </p>

        <div className={styles.machine}>
          <h2 className={styles.machineHeading}>Machine-readable versions</h2>
          <ul>
            <li>
              <a href={`${SITE_URL}/sitemap.xml`}>
                <code>/sitemap.xml</code>
              </a>{' '}
              — the XML sitemap search engines read to discover every URL on this site. Regenerated on
              every build.
            </li>
            <li>
              <a href={`${SITE_URL}/changelog/rss.xml`}>
                <code>/changelog/rss.xml</code>
              </a>{' '}
              — the RSS feed of release notes. Subscribe in any feed reader to get new versions without
              checking back.
            </li>
            <li>
              <a href={`${SITE_URL}/llms.txt`}>
                <code>/llms.txt</code>
              </a>{' '}
              — a plain-text map of this site written for AI assistants and coding agents.
            </li>
            <li>
              <a href={`${SITE_URL}/robots.txt`}>
                <code>/robots.txt</code>
              </a>{' '}
              — the crawl policy, including which AI crawlers are permitted.
            </li>
          </ul>
        </div>

        <input
          type="search"
          className={styles.search}
          placeholder="Search these pages…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search the sitemap"
        />
        {q && (
          <p className={styles.count}>
            {shown} of {ALL.length} pages match.
          </p>
        )}

        {groups.length === 0 && <p>No pages match that search.</p>}

        {groups.map((group) => (
          <section key={group.name} className={styles.group}>
            <h2>{group.name}</h2>
            <p className={styles.blurb}>{group.blurb}</p>
            <div className={styles.cards}>
              {group.entries.map((entry) => (
                <Link key={entry.to} to={entry.to} className={styles.card}>
                  <h3 className={styles.cardTitle}>{entry.title}</h3>
                  <p className={styles.cardDesc}>{entry.description}</p>
                  <p className={styles.tags}>
                    {entry.tags.map((t) => (
                      <span key={t} className={styles.tag}>
                        {t}
                      </span>
                    ))}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </main>
    </Layout>
  );
}
