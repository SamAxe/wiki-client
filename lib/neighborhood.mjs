// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
// The neighborhood provides a cache of site maps read from
// various federated wiki sites. It is careful to fetch maps
// slowly and keeps track of get requests in flight.

let neighborhood;
import miniSearch from 'minisearch';
import * as wiki from './wiki.mjs';

export class Neighborhood {

  sites = {};

retryNeighbor (site){
  console.log('retrying neighbor');
  const neighborInfo = {};
  neighborhood.sites[site] = neighborInfo;
  return populateSiteInfoFor(site, neighborInfo);
};

registerNeighbor (site){
  if (neighborhood.sites[site] != null) { return; }
  const neighborInfo = {};
  neighborhood.sites[site] = neighborInfo;
  populateSiteInfoFor( site, neighborInfo );
  return $('body').trigger('new-neighbor', site);
};

updateSitemap (pageObject){
  let neighborInfo;
  const site = location.host;
  if (!(neighborInfo = neighborhood.sites[site])) { return; }
  if (neighborInfo.sitemapRequestInflight) { return; }
  const slug = pageObject.getSlug();
  const date = pageObject.getDate();
  const title = pageObject.getTitle();
  const synopsis = pageObject.getSynopsis();
  const links = pageObject.getLinks();
  const entry = {slug, date, title, synopsis, links};
  const {
    sitemap
  } = neighborInfo;
  const index = sitemap.findIndex(slot => slot.slug === slug);
  if (index >= 0) {
    sitemap[index] = entry;
  } else {
    sitemap.push(entry);
  }
  return $('body').trigger('new-neighbor-done', site);
};

deleteFromSitemap (pageObject){
  let neighborInfo;
  const site = location.host;
  if (!(neighborInfo = neighborhood.sites[site])) { return; }
  if (neighborInfo.sitemapRequestInflight) { return; }
  const slug = pageObject.getSlug();
  const {
    sitemap
  } = neighborInfo;
  const index = sitemap.findIndex(slot => slot.slug === slug);
  if (!(index >= 0)) { return; }
  sitemap.splice(index);
  return $('body').trigger('delete-neighbor-done', site);
};

listNeighbors () { return Object.keys( neighborhood.sites ); }

updateIndex (pageObject) {
  let neighborInfo;
  console.log(`updating ${pageObject.getSlug()} in index`);
  const site = location.host;
  if (!(neighborInfo = neighborhood.sites[site])) { return; }

  const slug = pageObject.getSlug();
  const title = pageObject.getTitle();
  const rawStory = pageObject.getRawPage().story;
  const newText = rawStory.reduce( extractPageText, '');

  if (neighborInfo.siteIndex.has(slug)) {
    return neighborInfo.siteIndex.replace({
      'id': slug,
      'title': title,
      'content': newText
    });
  } else {
    return neighborInfo.siteIndex.add({
      'id': slug,
      'title': title,
      'content': newText
    });
  }
};

deleteFromIndex (pageObject) {
  let neighborInfo;
  const site = location.host;
  if (!(neighborInfo = neighborhood.sites[site])) { return; }

  const slug = pageObject.getSlug();
  try {
    return neighborInfo.siteIndex.discard(slug);
  } catch (err) {
    // swallow error, if the page was not in index
    if (!err.message.includes('not in the index')) { return console.log(`removing ${slug} from index failed`, err); }
  }
};


search (searchQuery){
  let neighborInfo, neighborSite;
  const finds = [];
  const tally = {};

  const tick = function(key) {
    if (tally[key] != null) { return tally[key]++; } else { return tally[key] = 1; }
  };



  const indexSite = function(site /*, siteInfo */) {
    const timeLabel = `indexing sitemap ( ${site} )`;
    console.time(timeLabel);
    console.log('indexing sitemap:', site);
    const siteIndex = new miniSearch({
      fields: ['title', 'content']
    });
    neighborInfo.sitemap.forEach((function(page) {
      siteIndex.add({
        'id': page.slug,
        'title': page.title,
        'content': page.synopsis
      });
    })
    );
    console.timeEnd(timeLabel);
    return siteIndex;
  };

  const start = Date.now();
  // load, or create (from sitemap), site index
  for (neighborSite of Object.keys(neighborhood.sites)) {
    neighborInfo = neighborhood.sites[neighborSite];
    if (neighborInfo.sitemap) {
      // do we already have an index?
      if (neighborInfo.siteIndex == null) {
        // create an index using sitemap
        neighborInfo.siteIndex = indexSite(neighborSite, neighborInfo);
      }
    }
  }

  const origin = location.host;
  for (neighborSite of Object.keys(neighborhood.sites)) {
    neighborInfo = neighborhood.sites[neighborSite];
    if (neighborInfo.siteIndex) {
      var contentBoost, error, searchResult, titleBoost;
      tick('sites');
      try {
        if (tally['pages'] != null) {
          tally['pages'] += neighborInfo.sitemap.length;
        } else {
          tally['pages'] = neighborInfo.sitemap.length;
        }
      } catch (error1) {
        error = error1;
        console.info('+++ sitemap not valid for ', neighborSite);
        neighborInfo.sitemap = [];
      }
      if (neighborSite === origin) {
        titleBoost = 20;
        contentBoost = 2;
      } else {
        titleBoost = 10;
        contentBoost = 1;
      }
      try {
        searchResult = neighborInfo.siteIndex.search(searchQuery, {
          boost: {
            title: titleBoost,
            content: contentBoost
          },
          prefix: true,
          combineWith: 'AND'
        }
        );
      } catch (error2) {
        error = error2;
        console.error('search index error', neighborSite, searchQuery, error);
        searchResult = [];
      }
      searchResult.forEach(function(result) {
        tick('finds');
        return finds.push({
          page: neighborInfo.sitemap.find(({slug}) => slug === result.id),
          site: neighborSite,
          rank: result.score
        });
      });
    }
  }
  
  // sort the finds by rank
  finds.sort((a, b) => b.rank - a.rank);
  
  tally['msec'] = Date.now() - start;
  return { finds, tally };
};

backLinks (slug) {

  const finds = [];

  for (var neighborSite of Object.keys(neighborhood.sites)) {
    var neighborInfo = neighborhood.sites[neighborSite];
    if (neighborInfo.sitemap) {
      neighborInfo.sitemap.forEach(function(sitemapData /*, pageSlug */) {
        if ((sitemapData.links != null) && (Object.keys(sitemapData.links).length > 0) && Object.keys(sitemapData.links).includes(slug)) {
          return finds.push({
            slug: sitemapData.slug,
            title: sitemapData.title,
            site: neighborSite,
            itemId: sitemapData.links[slug],
            date: sitemapData.date
          });
        }
      });
    }
  }
  const results = {};

  finds.forEach(function(find) {

    slug = find['slug'];

    results[slug] = results[slug] || {};
    results[slug]['title'] = find['title'];
    results[slug]['sites'] = results[slug]['sites'] || [];
    return results[slug]['sites'].push({
      site: find['site'],
      date: find['date'],
      itemId: find['itemId']});});
  return results;
};
    
 
}
let nextAvailableFetch = 0;
const nextFetchInterval = 500;

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const populateSiteInfoFor = function(site,neighborInfo){
  if (neighborInfo.sitemapRequestInflight) { return; }
  neighborInfo.sitemapRequestInflight = true;

  const transition = (site, from, to) => $(`.neighbor[data-site="${site}"]`)
    .find('div')
    .removeClass(from)
    .addClass(to);

  const boundedDelay = function(ms) {
    const minDelay = 60000;      // 1 minute
    const maxDelay = 43200000;   // 12 hours

    if (ms > maxDelay) {
      return maxDelay;
    }

    if (ms < minDelay) {
      return minDelay;
    }
    
    return ms;
  };

  var refreshMap = function(site, neighborInfo) {
    neighborInfo.sitemapRequestInflight = true;

    return wiki.site(site).get('system/sitemap.json', function(err, gotData) {
      neighborInfo.sitemapRequestInflight = false;
      if (err) {
        transition(site, 'fetch', 'fail');
        wiki.site(site).refresh(function() {});
          // empty function
        throw new Error('Unable to fetch sitemap');
      }

      let { data, lastModified } = gotData;
      
      if (isNaN(lastModified)) {
        lastModified = 0;
      }
        
      if (lastModified > neighborInfo.lastModified) {
        neighborInfo.sitemap = data;
        neighborInfo.lastModified = lastModified;
        $('body').trigger('new-neighbor-done', site);
        refreshIndex(site, neighborInfo);
      }

      const updateDelay = boundedDelay(Math.floor((Date.now() - lastModified) / 4 ));
      neighborInfo.nextCheck = Date.now() + updateDelay;
      console.log('delay for ', site, (updateDelay / 60000));
      transition(site, 'fetch', 'done');

      return delay(updateDelay)
        .then(function() {
          transition(site, 'done', 'fetch');
          return refreshMap(site, neighborInfo);
      });
    });
  };

  var refreshIndex = (site, neighborInfo) => // we use `wiki.site(site).getIndex` as we want the serialized index as a string.
  wiki.site(site).getIndex('system/site-index.json', function(err, data) {
    if (!err) {
      try {      
        neighborInfo.siteIndex = miniSearch.loadJSON(data, {
          fields: ['title', 'content']
        });
        return console.log(site, 'index loaded');
      } catch (error) {
        return console.log('error loading index - not a valid index', site);
      }
    } else {
      return console.log('error loading index', site, err);
    }
  });


  const fetchMap = function() {
    transition(site, 'wait', 'fetch');
    neighborInfo.lastModified = 0;
    return refreshMap(site, neighborInfo);
  };

  const now = Date.now();
  if (now > nextAvailableFetch) {
    nextAvailableFetch = now + nextFetchInterval;
    return setTimeout(fetchMap, 100);
  } else {
    setTimeout(fetchMap, nextAvailableFetch - now);
    return nextAvailableFetch += nextFetchInterval;
  }
};

// Page Search
const extractItemText = text => text.replace(/\[([^\]]*?)\][[(].*?[\])]/g, " $1 ")
  .replace(/\[{2}|\[(?:[\S]+)|\]{1,2}/g, ' ')
  .replace(/\n/g, ' ')
  .replace(/<style.*?<\/style>/g, ' ')
  .replace(/<(?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+>/g, ' ')
  .replace(/<(?:[^>])+>/g, ' ')
  .replace(/(https?.*?)(?=\p{White_Space}|\p{Quotation_Mark}|$)/gu, function(match) {
    const myUrl = new URL(match);
    return myUrl.hostname + myUrl.pathname;
})
  .replace(/[\p{P}\p{Emoji}\p{Symbol}}]+/gu, ' ')
  .replace(/[\p{White_Space}\n\t]+/gu, ' ');


const extractPageText = function(pageText, currentItem, currentIndex) {
  try {
    if (currentItem.text != null) {
      switch (currentItem.type) {
        case 'paragraph': case 'markdown': case 'html': case 'reference': case 'image': case 'pagefold': case 'math': case 'mathjax': case 'code':
          pageText += extractItemText(currentItem.text);
          break;
        case 'audio': case 'video': case 'frame':
          pageText += extractItemText(currentItem.text.split(/\r\n?|\n/)
            .map(function(line) {
              const firstWord = line.split(/\p{White_Space}/u)[0];
              if (firstWord.startsWith('http') || (firstWord.toUpperCase() === firstWord) || firstWord.startsWith('//')) {
                // line is markup
                return '';
              } else {
                return line;
              }
            }).join(' '));
          break;
      }
    }
  } catch (err) {
    throw new Error(`Error extracting text from ${currentIndex}, ${JSON.stringify(currentItem)} ${err}, ${err.stack}`);
  }
  return pageText;
};


 
