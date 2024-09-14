// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
// The itemz module understands how we have been keeping track of
// story items and their corresponding divs. It offers utility
// functions used elsewere. We anticipate a more proper model eventually.

import { PageHandler } from './pageHandler.mjs';

const pageHandler = new PageHandler();

import * as plugin from './plugin.mjs';
import * as random from './random.mjs';


const sleep = (time, done) => setTimeout(done, time);

export function getItem ($item) {
  if ($($item).length > 0) { return $($item).data("item") || $($item).data('staticItem'); }
};

export function removeItem ($item, item) {
  pageHandler.put($item.parents('.page:first'), {type: 'remove', id: item.id});
  return $item.remove();
};

export function createItem ($page, $before, item) {
  if ($page == null) { $page = $before.parents('.page'); }
  item.id = random.itemId();
  const $item = $(`\
<div class="item ${item.type}" data-id=""</div>\
`
  );
  $item
    .data('item', item)
    .data('pageElement', $page);
  if ($before != null) {
    $before.after($item);
  } else {
    $page.find('.story').append($item);
  }
  plugin.doPlugin($item, item);
  const before = getItem($before);
  sleep(500, () => pageHandler.put($page, {item, id: item.id, type: 'add', after: (before != null ? before.id : undefined)}));
  return $item;
};

export function replaceItem ($item, type, item) {
  const newItem = $.extend({}, item);
  $item.empty().off();
  $item.removeClass(type).addClass(newItem.type);
  const $page = $item.parents('.page:first');
  try {
    $item.data('pageElement', $page);
    $item.data('item', newItem);
    plugin.getPlugin(item.type, function(plugin) {
      plugin.emit($item, newItem);
      return plugin.bind($item, newItem);
    });
  } catch (err) {
    $item.append(`<p class='error'>${err}</p>`);
  }
  return pageHandler.put($page, {type: 'edit', id: newItem.id, item: newItem});
};

