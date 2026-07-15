import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// ---------------------------------------------------------------------------
// Empora for WooCommerce — Documentation site config
// Author: Ahsan Mahmood (https://aoneahsan.com)
// Product: https://empora.aoneahsan.com  ·  Free plugin: https://wordpress.org/plugins/empora-for-woocommerce/
// ---------------------------------------------------------------------------

const SITE_URL = 'https://empora-docs.aoneahsan.com';

const config: Config = {
  title: 'Empora for WooCommerce Docs',
  tagline:
    'The complete WooCommerce toolkit — product filters, reviews, wishlist, shipping, payments, gift cards, subscriptions, and more.',
  favicon: 'img/favicon.svg',

  url: SITE_URL,
  baseUrl: '/',

  organizationName: 'aoneahsan',
  projectName: 'empora-for-woocommerce-docs',

  onBrokenLinks: 'throw',
  onBrokenAnchors: 'warn',

  // SEO + AI-citability head tags injected into <head> of every page.
  headTags: [
    {
      tagName: 'link',
      attributes: { rel: 'canonical', href: `${SITE_URL}/` },
    },
    {
      tagName: 'meta',
      attributes: { name: 'application-name', content: 'Empora for WooCommerce Docs' },
    },
    {
      tagName: 'meta',
      attributes: { name: 'apple-mobile-web-app-title', content: 'Empora Docs' },
    },
    {
      tagName: 'meta',
      attributes: { name: 'theme-color', content: '#4F46E5' },
    },
    {
      tagName: 'script',
      attributes: { type: 'application/ld+json' },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Empora for WooCommerce Documentation',
        url: SITE_URL,
        description:
          'Documentation for Empora for WooCommerce, a comprehensive WooCommerce toolkit with a free core (product filters, reviews, wishlist, compare, social, SEO, basic dynamic pricing) and optional premium modules (advanced shipping, payments, taxes, inventory, bulk edit, import/export, reports, subscriptions, gift cards, and more).',
        inLanguage: 'en',
        publisher: {
          '@type': 'Person',
          name: 'Ahsan Mahmood',
          url: 'https://aoneahsan.com',
          email: 'aoneahsan@gmail.com',
          sameAs: [
            'https://linkedin.com/in/aoneahsan',
            'https://github.com/aoneahsan',
            'https://www.npmjs.com/~aoneahsan',
          ],
        },
      }),
    },
    {
      tagName: 'script',
      attributes: { type: 'application/ld+json' },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Empora for WooCommerce',
        alternateName: 'All-In-One WooCommerce',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'WordPress, WooCommerce',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          description: 'Free core modules; premium modules require a paid license.',
        },
        url: 'https://empora.aoneahsan.com',
        downloadUrl: 'https://wordpress.org/plugins/empora-for-woocommerce/',
        sameAs: [
          'https://empora.aoneahsan.com',
          'https://wordpress.org/plugins/empora-for-woocommerce/',
        ],
        author: {
          '@type': 'Person',
          name: 'Ahsan Mahmood',
          url: 'https://aoneahsan.com',
        },
        description:
          'A comprehensive WooCommerce plugin: free core (filters, reviews, wishlist, compare, social, SEO, basic dynamic pricing) plus optional premium modules unlocked by a paid license. HPOS-compatible. Requires WordPress 6.0+, WooCommerce 8.0+, PHP 8.1+.',
        softwareVersion: '1.0.0',
      }),
    },
    {
      tagName: 'script',
      attributes: { type: 'application/ld+json' },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Ahsan Mahmood',
        alternateName: 'aoneahsan',
        url: 'https://aoneahsan.com',
        email: 'aoneahsan@gmail.com',
        sameAs: [
          'https://linkedin.com/in/aoneahsan',
          'https://github.com/aoneahsan',
          'https://www.npmjs.com/~aoneahsan',
          'https://aoneahsan.com',
        ],
        founder: { '@type': 'Person', name: 'Ahsan Mahmood' },
      }),
    },
  ],

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  trailingSlash: false,

  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
          editUrl: 'https://github.com/aoneahsan/empora-for-woocommerce-docs/edit/main/',
          showLastUpdateTime: true,
          breadcrumbs: true,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          changefreq: 'weekly',
          priority: 0.7,
          lastmod: 'date',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/social-card.svg',
    metadata: [
      {
        name: 'description',
        content:
          'Documentation for Empora for WooCommerce — a comprehensive WooCommerce toolkit. Free core (filters, reviews, wishlist, compare, social, SEO, dynamic pricing) plus premium modules. Maintained by Ahsan Mahmood.',
      },
      {
        name: 'keywords',
        content:
          'woocommerce plugin, woocommerce toolkit, product filters, woocommerce wishlist, woocommerce reviews, dynamic pricing, advanced shipping, woocommerce payments, gift cards, woocommerce subscriptions, woocommerce gdpr, hpos compatible, woocommerce import export, woocommerce reports, empora',
      },
      { name: 'author', content: 'Ahsan Mahmood' },
      { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:creator', content: '@aoneahsan' },
      { name: 'twitter:site', content: '@aoneahsan' },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'Empora for WooCommerce Docs' },
      { property: 'og:locale', content: 'en_US' },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'article:author', content: 'Ahsan Mahmood' },
    ],
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    docs: {
      sidebar: {
        hideable: true,
        autoCollapseCategories: true,
      },
    },
    navbar: {
      title: 'Empora Docs',
      logo: {
        alt: 'Empora for WooCommerce logo',
        src: 'img/logo.svg',
        srcDark: 'img/logo.svg',
        width: 32,
        height: 32,
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'mainSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          to: '/getting-started/quick-start',
          label: 'Quick Start',
          position: 'left',
        },
        {
          to: '/modules/overview',
          label: 'Modules',
          position: 'left',
        },
        {
          href: 'https://empora.aoneahsan.com',
          label: 'Website',
          position: 'right',
        },
        {
          href: 'https://wordpress.org/plugins/empora-for-woocommerce/',
          label: 'WordPress.org',
          position: 'right',
        },
        {
          href: 'https://github.com/aoneahsan/empora-for-woocommerce-docs',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            { label: 'Introduction', to: '/intro' },
            { label: 'Installation', to: '/getting-started/installation' },
            { label: 'Quick Start', to: '/getting-started/quick-start' },
            { label: 'Modules', to: '/modules/overview' },
          ],
        },
        {
          title: 'Product',
          items: [
            { label: 'Website', href: 'https://empora.aoneahsan.com' },
            { label: 'Pricing', href: 'https://empora.aoneahsan.com/pricing' },
            { label: 'Free plugin (WordPress.org)', href: 'https://wordpress.org/plugins/empora-for-woocommerce/' },
            { label: 'Support', href: 'https://empora.aoneahsan.com/support' },
          ],
        },
        {
          title: 'Built by Ahsan Mahmood',
          items: [
            { label: 'aoneahsan.com', href: 'https://aoneahsan.com' },
            { label: 'LinkedIn', href: 'https://linkedin.com/in/aoneahsan' },
            { label: 'GitHub', href: 'https://github.com/aoneahsan' },
            { label: 'npm packages', href: 'https://www.npmjs.com/~aoneahsan' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Ahsan Mahmood. Built with Docusaurus. Empora for WooCommerce — free core is GPLv2; premium modules require a license.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'php', 'sql', 'yaml', 'diff'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
