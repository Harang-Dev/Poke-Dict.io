import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import gameData from '../src/data/games.json' with { type: 'json' };
import { defaultEntries, defenseMultiplier, entries, formsOf, statNames, statTotal, typeNames } from '../src/dex/catalogue.js';
import { movePath, pokemonPath } from '../src/paths.js';
import { formatPokemonNumber } from '../src/pokemonNumber.js';
import { dataSources, pageMetadata, typeLabel } from '../src/seo.js';
import { siteUrl } from './site-config.mjs';

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
];
const header = `<header class="site-header"><div>
  ${link('/', 'Poke-Dict', ' class="site-brand"')}
  <nav aria-label="주 메뉴">${nav.map(([path, label]) => link(path, label)).join(' ')}</nav>
</div></header>`;
const source = `<footer class="site-footer" aria-label="데이터 출처">${dataSources.map(([label, href]) =>
  `<a href="${text(href)}">${text(label)}</a>`).join('')}</footer>`;

await writePage('/', '포켓몬 도감', `
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
  const currentForms = formsOf(pokemon.number).filter(form => form.id !== pokemon.id);
  const neighbors = defaultEntries.filter(entry => Math.abs(entry.number - pokemon.number) === 1);
  const weaknesses = Object.keys(typeNames).flatMap(type => {
    const multiplier = defenseMultiplier(pokemon, type);
    return multiplier > 1 ? [`${typeLabel(type)} ${multiplier}배`] : [];
  });
  await writePage(pokemonPath(pokemon.id), pokemon.name, `
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
    <p>${link('/moves/', '← 기술 도감')}</p>
    <section class="panel">
      <h2>기본 수치</h2>
      ${facts([['타입', typeLabel(move.type)], ['위력', move.power], ['명중률', percentage(move.accuracy)], ['PP', move.pp]])}
    </section>
    <nav aria-label="이전·다음 기술"><ul class="link-chips">${neighbors.map(entry =>
      `<li>${link(movePath(entry.id), entry.name)}</li>`).join('')}</ul></nav>`, move);
}

for (const [path, name] of [...nav.filter(([path]) => path !== '/' && path !== '/moves/'), ['/binder/', '공유 바인더']]) {
  await writePage(path, path === '/quiz/' ? '오늘의 실루엣' : name, '');
}
await writePage('/404.html', '페이지를 찾을 수 없어요.', `<p>${link('/', '도감 목록으로')}</p>`);
await writeFile(join(output, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemap.map(url => `  <url><loc>${text(url)}</loc></url>`).join('\n')}
</urlset>
`);
if (siteUrl.pathname === '/') {
  await writeFile(join(output, 'robots.txt'), `User-agent: *\nDisallow:\n\nSitemap: ${new URL('sitemap.xml', siteUrl).href}\n`);
}
console.log(`Generated ${sitemap.length} indexable pages and sitemap.`);

async function writePage(path, heading, content, move) {
  const { title, description, canonicalPath } = pageMetadata(path, move);
  const canonical = canonicalPath && new URL(canonicalPath.slice(1), siteUrl).href;
  if (canonical) sitemap.push(canonical);
  const page = template
    .replace(/<meta name="description"[^>]*>/, () => description ? `<meta name="description" content="${text(description)}" />` : '')
    .replace(/<title>[^<]*<\/title>/, () => `<title>${text(title)}</title>
      ${canonical ? `<link rel="canonical" href="${text(canonical)}" />` : '<meta name="robots" content="noindex" />'}`)
    .replace('<div id="root"></div>', () => `<div id="root">${header}<main class="workspace">
      <h1>${text(heading)}</h1>${content}
    </main>${source}</div>`);
  const filename = join(output, path.slice(1), ...(path.endsWith('/') ? ['index.html'] : []));
  await mkdir(dirname(filename), { recursive: true });
  await writeFile(filename, page);
}

function link(path, label, attributes = '') {
  return `<a href="${text(new URL(path.slice(1), siteUrl).pathname)}"${attributes}>${text(label)}</a>`;
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
