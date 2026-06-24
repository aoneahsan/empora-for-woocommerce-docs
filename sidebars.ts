import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

/**
 * Sidebar layout for the Empora for WooCommerce documentation site.
 * Every page listed here exists in /docs.
 */
const sidebars: SidebarsConfig = {
  mainSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/installation',
        'getting-started/quick-start',
        'getting-started/activating-your-license',
      ],
    },
    {
      type: 'category',
      label: 'Modules',
      collapsed: false,
      items: [
        'modules/overview',
        'modules/free-core',
        'modules/premium',
        'modules/configuring-modules',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      collapsed: true,
      items: [
        'guides/product-filters',
        'guides/reviews-wishlist-compare',
        'guides/dynamic-pricing',
        'guides/gift-cards-and-rewards',
      ],
    },
    {
      type: 'category',
      label: 'Reference',
      collapsed: true,
      items: [
        'reference/requirements',
        'reference/architecture',
        'reference/rest-api',
        'reference/license-api',
        'reference/privacy-and-data',
      ],
    },
    'troubleshooting',
    'faq',
    'about-the-author',
  ],
};

export default sidebars;
