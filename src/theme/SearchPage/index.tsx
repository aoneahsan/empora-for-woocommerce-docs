/**
 * Wraps @easyops-cn/docusaurus-search-local's SearchPage for one change: its own noindex is written as
 * `<meta property="robots">`, which search engines do not read as a robots rule, and the site-wide
 * `name="robots"` index meta left `/search` indexable. This adds the `name="robots"` noindex (search audit
 * 2026-10-29, SA-EMPORA-001). The page stays out of the sitemap and is never Disallowed in robots.txt, so
 * crawlers can read the noindex. Recheck on every upgrade of the search plugin.
 */
import React, { type ReactNode } from 'react';
import Head from '@docusaurus/Head';
import SearchPage from '@theme-original/SearchPage';
import type SearchPageType from '@theme/SearchPage';
import type { WrapperProps } from '@docusaurus/types';

type Props = WrapperProps<typeof SearchPageType>;

export default function SearchPageWrapper(props: Props): ReactNode {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex, follow" />
      </Head>
      <SearchPage {...props} />
    </>
  );
}
