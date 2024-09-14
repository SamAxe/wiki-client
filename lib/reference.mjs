// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
// The Reference plugin holds a site and page name to be
// found on that site. Search, for example, produces a page of
// references. Double click will edit the body of a reference
// but not the name and site.

import * as editor from './editor.mjs';

import { Resolve } from './resolve.mjs';
const resolve = new Resolve();
import * as page from './page.mjs';
import * as wiki from './wiki.mjs';

// see http://fed.wiki.org/about-reference-plugin.html

export function emit ($item, item) {
  let {
    slug
  } = item;
  if (item.title != null) { if (!slug) { slug = page.asSlug(item.title); } }
  if (!slug) { slug = 'welcome-visitors'; }
  const {
    site
  } = item;
  return resolve.resolveFrom(site, () => $item.append(`\
<p>
<img class='remote'
  src='${wiki.site(site).flag()}'
  title='${site}'
  data-site="${site}"
  data-slug="${slug}"
>
${resolve.resolveLinks(`[[${item.title || slug}]]`)}
—
${resolve.resolveLinks(item.text)}
</p>\
`
  ));
};
export function bind ($item, item) { return $item.on('dblclick', () => editor.textEditor($item, item)); }

