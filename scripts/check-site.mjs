import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { siteUrl, adsensePublisherId } from './site-config.mjs';
import { learningArticles } from '../src/content/learning.js';
import { entryById } from '../src/dex/catalogue.js';
import { pokemonInsights } from '../src/dex/insights.js';

const output = 'dist';
const sitemap = await readFile(join(output, 'sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, value]) => value);
assert.equal(new Set(urls).size, urls.length, 'Sitemap contains duplicate URLs');
const indexed = new Set(urls);
const checkedLinks = new Set();
let pages = 0;
for (const filename of await htmlFiles(output)) {
  const html = await readFile(filename, 'utf8');
  const label = filename.slice(output.length + 1);
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
  assert.equal([...html.matchAll(/<h1(?:\s[^>]*)?>/g)].length, 1, `${label}: expected one h1`);
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  assert(title && !title.includes('undefined'), `${label}: missing or invalid title`);
  if (canonical) {
    assert(indexed.has(canonical[1]), `${label}: canonical absent from sitemap`);
    assert(!/<meta name="robots" content="noindex/.test(html), `${label}: indexed page is noindex`);
    assert(/<meta name="description" content="[^"]+"/.test(html), `${label}: missing description`);
    assert(!new URL(canonical[1]).search && !new URL(canonical[1]).hash, `${label}: query/hash canonical`);
    assert(canonical[1].startsWith(siteUrl.href), `${label}: wrong canonical origin/base`);
  } else {
    assert(/<meta name="robots" content="noindex"/.test(html), `${label}: non-public page must be noindex`);
  }
  for (const key of ['og:title', 'og:url', 'og:image']) {
    assert.equal([...html.matchAll(new RegExp(`<meta property="${key}"`, 'g'))].length, 1, `${label}: ${key}`);
  }
  const json = html.match(/<script id="page-structured-data" type="application\/ld\+json">([\s\S]+?)<\/script>/)?.[1];
  if (canonical) {
    assert(json, `${label}: missing structured data`);
    const graph = JSON.parse(json)['@graph'];
    assert(graph.some(item => item['@type'] === 'WebPage' && item.url === canonical[1]), `${label}: structured URL differs`);
    assert(!graph.some(item => ['Product', 'AggregateRating', 'FAQPage'].includes(item['@type'])), `${label}: unsupported markup`);
    const crumbs = graph.find(item => item['@type'] === 'BreadcrumbList');
    if (crumbs) {
      assert(html.includes('aria-label="현재 위치"'), `${label}: invisible breadcrumbs`);
      for (const [index, item] of crumbs.itemListElement.entries()) assert.equal(item.position, index + 1);
    }
  } else assert(!json, `${label}: stale structured data on private/unknown page`);
  assert.equal(html.includes('name="google-adsense-account"'), Boolean(adsensePublisherId), `${label}: verification metadata mismatch`);
  assert(!html.includes('pagead2.googlesyndication.com'), `${label}: ads must remain disabled`);
  for (const [, rawHref] of html.matchAll(/<a\b[^>]*href="([^"]+)"/g)) {
    const href = rawHref.replaceAll('&amp;', '&');
    const target = new URL(href, canonical?.[1] ?? siteUrl.href);
    if (target.origin !== siteUrl.origin || checkedLinks.has(target.pathname)) continue;
    checkedLinks.add(target.pathname);
    assert(target.pathname.startsWith(siteUrl.pathname), `${label}: internal link escapes base: ${href}`);
    const relative = decodeURIComponent(target.pathname.slice(siteUrl.pathname.length));
    const path = join(output, relative, ...(target.pathname.endsWith('/') ? ['index.html'] : []));
    await access(path).catch(() => { throw new Error(`${label}: broken local link ${href}`); });
  }
  pages++;
}
for (const url of urls) {
  const target = new URL(url);
  await access(join(output, target.pathname.slice(siteUrl.pathname.length), 'index.html'));
}
for (const article of learningArticles) {
  const html = await readFile(join(output, 'learn', article.slug, 'index.html'), 'utf8');
  for (const section of article.sections) {
    assert(html.includes(section.heading));
    for (const paragraph of section.paragraphs) assert(html.includes(paragraph), `${article.slug}: missing visible article text`);
  }
}
for (const id of ['6', '25', '10001']) {
  const html = await readFile(join(output, 'pokemon', id, 'index.html'), 'utf8');
  for (const paragraph of Object.values(pokemonInsights(entryById.get(id)))) assert(html.includes(paragraph), `${id}: missing local insight`);
}
const image = await readFile(join(output, 'social-card.png'));
assert.equal(image.readUInt32BE(16), 1200, 'Social image width');
assert.equal(image.readUInt32BE(20), 630, 'Social image height');
const hostRoot = siteUrl.pathname === '/' ? output : 'deployment-root';
const robots = await readFile(join(hostRoot, 'robots.txt'), 'utf8');
assert(robots.includes(`Sitemap: ${new URL('sitemap.xml', siteUrl).href}`));
if (adsensePublisherId) {
  const ads = await readFile(join(hostRoot, 'ads.txt'), 'utf8');
  assert(ads.includes(adsensePublisherId.slice(3)));
} else {
  let exists = true;
  try { await access(join(hostRoot, 'ads.txt')); } catch { exists = false; }
  assert(!exists, 'Do not publish ads.txt without a real publisher ID');
}
console.log(`Verified ${pages} HTML pages, ${indexed.size} sitemap URLs, ${checkedLinks.size} local link targets, structured data, source text and inactive-ad state.`);

async function htmlFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await htmlFiles(path));
    else if (entry.name.endsWith('.html')) files.push(path);
  }
  return files;
}
