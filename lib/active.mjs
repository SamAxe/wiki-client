// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:

 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
// Wiki considers one page to be active. Use active.set to change which
// page this is. A page need not be active to be edited.

export let scrollContainer = undefined;

const findScrollContainer = function() {
  const scrolled = $("body, html").filter(function() { return $(this).scrollLeft() > 0; });
  if (scrolled.length > 0) {
    return scrolled;
  } else {
    return $("body, html").scrollLeft(12).filter(function() { return $(this).scrollLeft() > 0; }).scrollTop(0);
  }
};

export function scrollTo($page) {
  let scrollTarget;
  if ($page.position() == null) { return; }
  if (scrollContainer == null) { scrollContainer = findScrollContainer(); }
  const bodyWidth = $("body").width();
  const minX = scrollContainer.scrollLeft();
  const maxX = minX + bodyWidth;
  const target = $page.position().left;
  const width = $page.outerWidth(true);
  const contentWidth = $(".page").outerWidth(true) * $(".page").length;

  // determine target position to scroll to...
  if (target < minX) {
    scrollTarget = target;
  } else if ((target + width) > maxX) {
    scrollTarget = target - (bodyWidth - width);
  } else if (maxX > $(".pages").outerWidth()) {
    scrollTarget = Math.min(target, contentWidth - bodyWidth);
  }
  // scroll to target and set focus once animation is complete
  scrollContainer.animate({
    scrollLeft: scrollTarget
    }, function() {
      // only set focus if focus is not already within the page to get focus
      if (!$.contains($page[0], document.activeElement)) { $page.trigger('focus'); }
  } );
};


export function set($page, noScroll) {
  $('.incremental-search').remove();
  $page = $($page);
  $(".active").removeClass("active");
  $page.addClass("active");
  if (!noScroll) { scrollTo($page); }
};
