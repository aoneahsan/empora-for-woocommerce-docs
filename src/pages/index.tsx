import type { ReactNode } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';

import styles from './index.module.css';

type Feature = {
  title: string;
  body: string;
};

const FEATURES: Feature[] = [
  {
    title: 'Free core, no license needed',
    body: 'Seven core modules work indefinitely without a license: Product Filters (AJAX), Reviews, Wishlist, Compare List, Social sharing, basic SEO, and basic Dynamic Pricing.',
  },
  {
    title: 'Premium modules on demand',
    body: 'A paid license unlocks advanced shipping, payment gateways, taxes, inventory, bulk edit, import/export, and extended reports — enable only what your store needs.',
  },
  {
    title: 'Conversion-focused storefront',
    body: 'Gift cards, rewards points, subscriptions, bookings, multi-currency, waitlists, recently-viewed, recommendations, smart coupons, and more — built to lift revenue.',
  },
  {
    title: 'Back-office automation',
    body: 'Email automation, shipment tracking, invoicing, abandoned-cart recovery, scheduled reports, and bulk product/order tooling reduce manual work.',
  },
  {
    title: 'HPOS-compatible',
    body: 'Empora declares full compatibility with WooCommerce High-Performance Order Storage, so it stays fast on the current WooCommerce data model.',
  },
  {
    title: 'One unified admin',
    body: 'A React-powered admin panel collects every module behind a clean Modules grid and a single Settings store, with a Dashboard that shows license + module status at a glance.',
  },
];

function HomepageHeader(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero', styles.heroBanner)}>
      <div className="container">
        <h1 className={styles.heroTitle}>{siteConfig.title}</h1>
        <p className={styles.heroTagline}>{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link className="button button--primary button--lg" to="/getting-started/quick-start">
            Quick Start — 5 min
          </Link>
          <Link className="button button--secondary button--lg" to="/getting-started/installation">
            Installation
          </Link>
          <Link
            className="button button--outline button--lg"
            href="https://wordpress.org/plugins/empora-for-woocommerce/"
          >
            Get the free plugin
          </Link>
        </div>
      </div>
    </header>
  );
}

function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.featuresWrap}>
      <div className="container">
        <div className="row">
          {FEATURES.map((f) => (
            <div key={f.title} className="col col--4" style={{ marginBottom: '1.5rem' }}>
              <div className={styles.featureCard}>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureBody}>{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AuthorStrip(): ReactNode {
  return (
    <section className={styles.authorStrip}>
      <div className="container">
        <p>
          Built and maintained by <Link href="https://aoneahsan.com">Ahsan Mahmood</Link> —{' '}
          <Link href="https://linkedin.com/in/aoneahsan">LinkedIn</Link> ·{' '}
          <Link href="https://github.com/aoneahsan">GitHub</Link> ·{' '}
          <Link href="https://empora.aoneahsan.com">empora.aoneahsan.com</Link>
        </p>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} — the complete WooCommerce toolkit`}
      description="Documentation for Empora for WooCommerce: install the free plugin, activate a premium license, and configure 90+ modules covering filters, reviews, wishlist, shipping, payments, gift cards, subscriptions, and more."
    >
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <AuthorStrip />
      </main>
    </Layout>
  );
}
