import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// ---------------------------------------------------------------------------
// Empora for WooCommerce — Documentation site config
// Author: Ahsan Mahmood (https://aoneahsan.com)
// Product: https://empora.aoneahsan.com  ·  Docs: https://empora-docs.aoneahsan.com
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
      // Feed autodiscovery — how readers and aggregators find the changelog.
      tagName: 'link',
      attributes: {
        rel: 'alternate',
        type: 'application/rss+xml',
        title: 'Empora for WooCommerce — releases',
        href: `${SITE_URL}/changelog/rss.xml`,
      },
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
          'Documentation for Empora for WooCommerce: installation, module reference for all 78 modules, plans, guides, troubleshooting and API reference. Free core of 7 modules plus premium modules unlocked by a license.',
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
          availability: 'https://schema.org/InStock',
          description:
            'The free core (7 modules) requires no license. Paid plans — Starter, Professional, Business and Enterprise — unlock the remaining modules; self-serve purchase is not available yet, so a paid plan is arranged by contacting the author.',
        },
        url: 'https://empora.aoneahsan.com',
        sameAs: ['https://empora.aoneahsan.com'],
        author: {
          '@type': 'Person',
          name: 'Ahsan Mahmood',
          url: 'https://aoneahsan.com',
        },
        description:
          'A WooCommerce plugin providing 78 modules: a free core of 7 modules (filters, reviews, wishlist, compare, social, SEO, dynamic pricing) plus premium modules unlocked by a paid license. HPOS-compatible. Requires WordPress 6.2+, WooCommerce 8.0+, PHP 8.1+.',
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
      onBrokenMarkdownLinks: 'throw',
    },
  },
  themes: [
    '@docusaurus/theme-mermaid',
    [
      // Local, build-time search index. No API key, no third-party service, so
      // the build never depends on a secret.
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        indexDocs: true,
        indexBlog: true,
        indexPages: true,
        docsRouteBasePath: '/',
        // Both are needed: the plugin resolves the on-disk dir separately from
        // the route, and defaults blogDir to 'blog', which does not exist here.
        blogDir: 'changelog',
        blogRouteBasePath: '/changelog',
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
        searchBarShortcutHint: false,
      },
    ],
  ],

  plugins: [
    /**
     * Docusaurus's feed generator omits `<atom:link rel="self">`, which RSS
     * validators require and which is the element most feeds are missing. It is
     * a channel-level element with no config hook, so it is injected into the
     * built file here. `<guid>` also gains an explicit `isPermaLink` — the RSS
     * default, stated rather than implied.
     */
    function feedSelfLinkPlugin() {
      return {
        name: 'feed-self-link',
        async postBuild({ outDir, siteConfig }: { outDir: string; siteConfig: { url: string } }) {
          const fs = await import('node:fs/promises');
          const path = await import('node:path');
          const feedPath = path.join(outDir, 'changelog', 'rss.xml');

          // Docusaurus runs every plugin's postBuild concurrently (Promise.all),
          // so this races the blog plugin that writes the feed. Wait for it
          // rather than assuming an order that does not exist.
          const deadline = Date.now() + 30_000;
          let xml: string | null = null;
          while (Date.now() < deadline) {
            try {
              xml = await fs.readFile(feedPath, 'utf8');
              break;
            } catch {
              await new Promise((r) => setTimeout(r, 100));
            }
          }
          if (xml === null) {
            throw new Error(
              `feed-self-link: no feed appeared at ${feedPath} within 30s. The changelog blog must be enabled with feedOptions.`,
            );
          }

          if (xml.includes('rel="self"')) return;

          const patched = xml
            .replace(
              '<rss version="2.0"',
              '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"',
            )
            .replace(
              '<channel>',
              `<channel>
        <atom:link href="${siteConfig.url}/changelog/rss.xml" rel="self" type="application/rss+xml"/>`,
            )
            .replace(/<guid>/g, '<guid isPermaLink="true">');

          if (!patched.includes('rel="self"')) {
            throw new Error('feed-self-link: failed to inject the self link — the feed markup changed.');
          }
          await fs.writeFile(feedPath, patched, 'utf8');
        },
      };
    },
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Published pages live in `content/`, NOT in `docs/`. This repo is
          // public and `docs/` holds the internal fixed-path file
          // docs/MANUAL-TASKS.md, which the global rule pins there. Keeping the
          // two directories separate means the internal file is not in the
          // published tree at all, so no `exclude` entry has to hold the line —
          // and a future config change cannot accidentally publish it.
          path: 'content',
          routeBasePath: '/',
          editUrl: 'https://github.com/aoneahsan/empora-for-woocommerce-docs/edit/main/',
          showLastUpdateTime: true,
          breadcrumbs: true,
        },
        blog: {
          // The changelog is a blog in Docusaurus terms; that is what generates
          // /changelog/rss.xml and /changelog/atom.xml.
          path: 'changelog',
          routeBasePath: 'changelog',
          blogTitle: 'Empora changelog',
          blogDescription:
            'Release notes for Empora for WooCommerce — every version, what changed, and what it affects.',
          blogSidebarTitle: 'Releases',
          blogSidebarCount: 'ALL',
          showReadingTime: false,
          onUntruncatedBlogPosts: 'ignore',
          feedOptions: {
            type: 'all',
            title: 'Empora for WooCommerce — releases',
            description:
              'Release notes for Empora for WooCommerce, the all-in-one WooCommerce plugin.',
            copyright: `Copyright © ${new Date().getFullYear()} Ahsan Mahmood.`,
            language: 'en',
            createFeedItems: async (params) => {
              const { blogPosts, defaultCreateFeedItems, ...rest } = params;
              return defaultCreateFeedItems({ blogPosts, ...rest });
            },
          },
        },
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
          to: '/pricing',
          label: 'Plans',
          position: 'left',
        },
        {
          to: '/changelog',
          label: 'Changelog',
          position: 'left',
        },
        {
          href: 'https://empora.aoneahsan.com',
          label: 'Website',
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
            { label: 'Module reference', to: '/modules/reference' },
            { label: 'Plans', to: '/pricing' },
          ],
        },
        {
          title: 'Product',
          items: [
            { label: 'Website', href: 'https://empora.aoneahsan.com' },
            { label: 'Changelog', to: '/changelog' },
            { label: 'Support & contact', to: '/support' },
            { label: 'FAQ', to: '/faq' },
          ],
        },
        {
          title: 'Discover',
          items: [
            { label: 'Sitemap', to: '/sitemap' },
            // Absolute: these are static files in build/, not Docusaurus routes,
            // so a root-relative href trips the broken-link checker.
            { label: 'sitemap.xml', href: `${SITE_URL}/sitemap.xml` },
            { label: 'RSS feed', href: `${SITE_URL}/changelog/rss.xml` },
            { label: 'llms.txt', href: `${SITE_URL}/llms.txt` },
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
