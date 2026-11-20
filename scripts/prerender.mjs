import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import gameData from '../src/data/games.json' with { type: 'json' };
import { defaultEntries, defenseMultiplier, entries, formsOf, statNames, statTotal, typeNames } from '../src/dex/catalogue.js';
import { movePath, pokemonPath } from '../src/paths.js';
import { formatPokemonNumber } from '../src/pokemonNumber.js';
import { dataSources, pageHead, serializeStructuredData, typeLabel } from '../src/seo.js';
import { adsensePublisherId, siteUrl } from './site-config.mjs';
import { footerDescription, footerLinks, footerRightsNotice, footerStorageNotice, guideSections } from '../src/siteInfo.js';
import { catalogueSource, editorialDate, learningArticles } from '../src/content/learning.js';
import { informationPages } from '../src/content/information.js';
import { directoryPage, directoryPath } from '../src/content/directories.js';
import { matchupScope, moveScope, moveSummary, pokemonInsights } from '../src/dex/insights.js';

const output = 'dist';
const template = await readFile(join(output, 'index.html'), 'utf8');
const sitemap = [];
const nav = [
  ['/', '도감'],
  ['/collection/', '내 컬렉션'],
  ['/compare/', '비교'],
  ['/moves/', '기술'],
  ['/quiz/', '퀴즈'],
  ['/team/', '내 팀'],
  ['/learn/', '가이드'],
];
const header = `<header class="site-header"><div>
  ${link('/', 'Poke-Dict', ' class="site-brand"')}
  <nav aria-label="주 메뉴">${nav.map(([path, label]) => link(path, label)).join(' ')}</nav>
</div></header>`;
const source = `<footer class="site-footer" aria-label="사이트 정보"><div class="site-footer__inner">
  <div class="site-footer__main">
    <div><strong class="site-footer__brand">Poke-Dict</strong><p>${text(footerDescription)}</p><p class="site-footer__storage">${text(footerStorageNotice)}</p></div>
    <nav class="site-footer__links" aria-label="서비스 안내">${footerLinks.map(([path, label]) => link(path, label)).join('')}</nav>
  </div>
  <div class="site-footer__bottom">
    <nav class="site-footer__links" aria-label="데이터 출처">${dataSources.map(([label, href]) => link(href, label)).join('')}</nav>
    <p>${text(footerRightsNotice)}</p>
  </div>
</div></footer>`;

await writePage('/', '포켓몬 도감', `
  <p>한국어 포켓몬 도감 · 약점과 종족값을 확인하고, 폼별 비교에서 나만의 컬렉션까지.</p>
  <nav class="section-nav" aria-label="도감 둘러보기">${link('/types/', '타입별 도감')}${link('/generations/', '세대별 도감')}${link('/learn/', '초보자 가이드')}</nav>
  <section class="panel">
    <h2>전국도감</h2>
    <ul class="link-chips">${entries.slice(0, 24).map(pokemonListItem).join('')}</ul>
  </section>`);
await writePage('/moves/', '기술 도감', `
  <div class="table-scroll"><table>
    <thead><tr><th scope="col">기술</th><th scope="col">타입</th><th scope="col">위력</th><th scope="col">명중률</th><th scope="col">PP</th></tr></thead>
    <tbody>${gameData.moves.slice(0, 25).map(move => `<tr><th scope="row">${link(movePath(move.id), move.name)}</th>${
      [typeLabel(move.type), move.power, percentage(move.accuracy), move.pp].map(value => `<td>${text(value ?? '—')}</td>`).join('')
    }</tr>`).join('')}</tbody>
  </table></div>`);

for (const pokemon of entries) {
  const insights = pokemonInsights(pokemon);
  const currentForms = formsOf(pokemon.number).filter(form => form.id !== pokemon.id);
  const neighbors = defaultEntries.filter(entry => Math.abs(entry.number - pokemon.number) === 1);
  const weaknesses = Object.keys(typeNames).flatMap(type => {
    const multiplier = defenseMultiplier(pokemon, type);
    return multiplier > 1 ? [`${typeLabel(type)} ${multiplier}배`] : [];
  });
  await writePage(pokemonPath(pokemon.id), pokemon.name, `
    <section class="panel pokemon-overview"><h2>${text(pokemon.name)} 한눈에 보기</h2>
      <p>${text(insights.intro)}</p><p>${text(insights.statText)}</p>
      <h3>${text(pokemon.name)}의 약점은?</h3><p>${text(insights.weaknessText)}</p>
      <p class="content-source">${text(matchupScope)}</p>
      <nav class="section-nav">${pokemon.types.map(type => link(`/types/${type}/`, `${typeLabel(type)} 타입 도감`)).join('')}
      ${link(`/generations/${pokemon.generation}/`, `${pokemon.generation}세대 도감`)}${link('/learn/type-matchups/', '상성 읽는 법')}</nav>
      <p class="content-source">기본 정보·계산 출처: ${link(catalogueSource, 'PokéAPI 데이터 리비전')}</p>
    </section>
    <p>${text(formatPokemonNumber(pokemon.number))} · ${text(pokemon.slug)}</p>
    <section class="panel">
      ${facts([
        ['타입', pokemon.types.map(typeLabel).join(' · ')],
        ['세대', `${pokemon.generation}세대`],
        ['키', unit(pokemon.height, 'm')],
        ['몸무게', unit(pokemon.weight, 'kg')],
        ['약점', weaknesses.length ? weaknesses.join(' · ') : '없음'],
      ])}
    </section>
    <section class="panel">
      <h2>기본 스탯</h2>
      ${facts([...statNames.map((name, index) => [name, pokemon.stats[index]]), ['합계', statTotal(pokemon)]])}
    </section>
    ${currentForms.length ? `<section class="panel"><h2>다른 폼</h2><ul class="link-chips">${currentForms.map(pokemonListItem).join('')}</ul></section>` : ''}
    ${neighbors.length ? `<nav aria-label="이전·다음 포켓몬"><ul class="link-chips">${neighbors.map(pokemonListItem).join('')}</ul></nav>` : ''}`);
}

for (const [index, move] of gameData.moves.entries()) {
  const neighbors = [gameData.moves[index - 1], gameData.moves[index + 1]].filter(Boolean);
  await writePage(movePath(move.id), move.name, `
    <section class="panel"><h2>기술 한눈에 보기</h2><p>${text(moveSummary(move))}</p><p>${text(moveScope)} ${link('/learn/version-data/', '게임별 데이터 읽는 법')}</p></section>
    <p>${link('/moves/', '← 기술 도감')}</p>
    <section class="panel">
      <h2>기본 수치</h2>
      ${facts([['타입', typeLabel(move.type)], ['위력', move.power], ['명중률', percentage(move.accuracy)], ['PP', move.pp]])}
    </section>
    <nav aria-label="이전·다음 기술"><ul class="link-chips">${neighbors.map(entry =>
      `<li>${link(movePath(entry.id), entry.name)}</li>`).join('')}</ul></nav>`, move);
}

for (const [path, name] of [...nav.filter(([path]) => !['/', '/moves/', '/learn/'].includes(path)), ['/binder/', '공유 바인더']]) {
  await writePage(path, path === '/quiz/' ? '오늘의 실루엣' : name, '');
}
await writePage('/guide/', '이용 및 데이터 안내', renderSections(guideSections));
for (const [slug, page] of Object.entries(informationPages)) {
  await writePage(`/${slug}/`, page.title, `<p>${text(page.description)}</p>${renderSections(page.sections)}`);
}
await writePage('/learn/', '포켓몬 도감 활용 가이드', `
  <p>타입과 기본 스탯을 읽는 방법부터, 폼별 수집과 팀 점검까지 실제 예시로 확인하세요.</p>
  <ul class="content-cards">${learningArticles.map(article => `<li>${link(`/learn/${article.slug}/`, article.title)}<p>${text(article.description)}</p></li>`).join('')}</ul>`);
for (const article of learningArticles) {
  await writePage(`/learn/${article.slug}/`, article.title, `
    <p>${text(article.description)}</p><p class="content-source">Poke-Dict 편집 · <time datetime="${editorialDate}">2026년 11월 20일 작성</time><br />
    계산 예시와 데이터 기준: ${link(catalogueSource, 'PokéAPI 고정 리비전')}</p>
    ${renderSections(article.sections)}<section><h2>직접 확인해 보기</h2>${renderLinks(article.links)}</section>`);
}
for (const kind of ['types', 'generations']) {
  for (const value of [undefined, ...directoryPage(kind).options.map(([id]) => id)]) {
    const page = directoryPage(kind, value);
    const items = page.entries
      ? page.entries.map(entry => `<li>${link(pokemonPath(entry.id), `${formatPokemonNumber(entry.number)} ${entry.name}`)}</li>`)
      : page.options.map(([id, label]) => `<li>${link(directoryPath(kind, id), label + (kind === 'types' ? ' 타입' : ''))}</li>`);
    await writePage(directoryPath(kind, value), page.title, `
      <p>${text(page.description)}</p>${page.note ? `<p class="content-source">${text(page.note)}</p>` : ''}
      <ul class="directory-list">${items.join('')}</ul>
      <nav class="section-nav">${link('/learn/', '도감 활용 가이드')}${link('/', '전체 도감 검색')}</nav>`);
  }
}
await writePage('/404.html', '페이지를 찾을 수 없어요.', `<p>${link('/', '도감 목록으로')}</p>`);
await writeFile(join(output, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemap.map(url => `  <url><loc>${text(url)}</loc></url>`).join('\n')}
</urlset>
`);
const hostRoot = siteUrl.pathname === '/' ? output : 'deployment-root';
await rm('deployment-root', { recursive: true, force: true });
await mkdir(hostRoot, { recursive: true });
await writeFile(join(hostRoot, 'robots.txt'), `User-agent: *\nDisallow:\n\nSitemap: ${new URL('sitemap.xml', siteUrl).href}\n`);
if (adsensePublisherId) {
  await writeFile(join(hostRoot, 'ads.txt'), `google.com, ${adsensePublisherId.slice(3)}, DIRECT, f08c47fec0942fa0\n`);
}
console.log(`Generated ${sitemap.length} indexable pages and sitemap.`);

async function writePage(path, heading, content, move) {
  const { title, description, canonicalPath, url, social, structuredData, breadcrumbs } = pageHead(path, siteUrl.href, move);
  const canonical = canonicalPath && url;
  if (canonical) sitemap.push(canonical);
  const page = template
    .replace(/<meta name="description"[^>]*>/, '')
    .replace(/<title>[^<]*<\/title>/, () => `<title>${text(title)}</title>
      ${description ? `<meta name="description" content="${text(description)}" />` : ''}
      ${canonical ? `<link rel="canonical" href="${text(canonical)}" />` : '<meta name="robots" content="noindex" />'}
      ${social.filter(([, , value]) => value).map(([attribute, key, value]) => `<meta ${attribute}="${key}" content="${text(value)}" />`).join('\n')}
      ${structuredData ? `<script id="page-structured-data" type="application/ld+json">${serializeStructuredData(structuredData)}</script>` : ''}`)
    .replace('<div id="root"></div>', () => `<div id="root">${header}<main class="workspace${/^\/(learn|guide|about|privacy|contact)\//.test(path) ? ' guide' : ''}">
      ${breadcrumbs?.length > 1 ? `<nav class="breadcrumbs" aria-label="현재 위치"><ol>${breadcrumbs.map(({ name, path: target }, index) => `<li>${index === breadcrumbs.length - 1 ? `<span aria-current="page">${text(name)}</span>` : link(target, name)}</li>`).join('')}</ol></nav>` : ''}
      <h1>${text(heading)}</h1>${content}
    </main>${source}</div>`);
  const filename = join(output, path.slice(1), ...(path.endsWith('/') ? ['index.html'] : []));
  await mkdir(dirname(filename), { recursive: true });
  await writeFile(filename, page);
}

function renderSections(sections) {
  return sections.map(({ heading, paragraphs, links }) => `<section><h2>${text(heading)}</h2>
    ${paragraphs.map(paragraph => `<p>${text(paragraph)}</p>`).join('')}${links ? renderLinks(links) : ''}</section>`).join('');
}

function renderLinks(links) {
  return `<ul class="guide__links">${links.map(([href, label]) => `<li>${link(href, label)}</li>`).join('')}</ul>`;
}

function link(path, label, attributes = '') {
  const url = new URL(path.startsWith('/') ? path.slice(1) : path, siteUrl);
  const href = path.startsWith('/') ? url.pathname + url.search + url.hash : path;
  return `<a href="${text(href)}"${attributes}>${text(label)}</a>`;
}

function pokemonListItem(entry) {
  return `<li>${link(pokemonPath(entry.id), `${formatPokemonNumber(entry.number)} ${entry.name}`)}</li>`;
}

function facts(rows) {
  return `<dl class="stat-list">${rows.map(([label, value]) =>
    `<div><dt>${text(label)}</dt><dd>${text(value ?? '—')}</dd></div>`).join('')}</dl>`;
}

function unit(value, suffix) {
  return value == null ? null : `${value / 10} ${suffix}`;
}

function percentage(value) {
  return value == null ? null : `${value}%`;
}

function text(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}
