import { expect, test } from 'vitest';
import { directoryPage } from './content/directories';
import { entryById } from './dex/catalogue';
import { matchupScope, moveSummary, pokemonInsights } from './dex/insights';
import { pageHead, pageMetadata, serializeStructuredData } from './seo';

test('describes real form data and multiplies dual-type weaknesses without treating immunity as a weakness', () => {
  const charizard = pokemonInsights(entryById.get('6'));
  expect(charizard.weaknessText).toContain('바위 4배');
  expect(charizard.weaknessText).toContain('물 2배');
  expect(charizard.weaknessText).not.toContain('땅');
  const deoxys = pokemonInsights(entryById.get('10001'));
  expect(deoxys.intro).toContain('No. 386');
  expect(deoxys.intro).toContain('다른 폼');
  expect(deoxys.statText).toContain('공격·특수공격(180)');
  expect(matchupScope).toContain('특성·도구·필드·테라스탈은 반영하지 않습니다');
});

test('distinguishes missing move numbers from zero', () => {
  const text = moveSummary({ name: '칼춤', type: 'normal', power: null, accuracy: null, pp: 20 });
  expect(text).toContain('위력 제공되는 수치 없음');
  expect(text).toContain('명중률 제공되는 수치 없음');
  expect(text).not.toContain('0%');
});

test('counts unique species separately from forms in directory pages', () => {
  const page = directoryPage('generations', '3');
  expect(page.entries.some(({ id }) => id === '10001')).toBe(true);
  expect(page.note).toContain('종의 첫 등장');
  expect(page.note).toContain('출현·사용 가능 목록이 아닙니다');
  expect(directoryPage('types', 'not-a-type')).toBeNull();
  expect(directoryPage('generations', '01')).toBeNull();
});

test.each(['https://example.test/', 'https://example.test/pokedex/'])('keeps canonical, social and breadcrumb URLs at the configured base %s', (base) => {
  const head = pageHead('/pokemon/25/', base);
  expect(head.url).toBe(base + 'pokemon/25/');
  expect(head.image).toBe(base + 'social-card.png');
  const graph = head.structuredData['@graph'];
  expect(graph.find(item => item['@type'] === 'WebPage').url).toBe(head.url);
  expect(graph.find(item => item['@type'] === 'BreadcrumbList').itemListElement.map(item => item.item)).toEqual([base, base + 'pokemon/25/']);
});

test.each(['/binder/', '/collection/', '/compare/', '/team/', '/quiz/', '/pokemon/999999/', '/learn/missing/', '/types/unknown/', '/constructor/', '/toString/', '/__proto__/'])('keeps private or unknown %s out of indexing metadata', (path) => {
  const head = pageHead(path, 'https://example.test/');
  expect(head.canonicalPath).toBeNull();
  expect(head.structuredData).toBeNull();
});

test('marks authored visible guides as articles and information pages as ordinary pages', () => {
  const article = pageHead('/learn/type-matchups/', 'https://example.test/');
  expect(article.structuredData['@graph'].find(item => item['@type'] === 'Article').author.name).toBe('Poke-Dict');
  for (const path of ['/about/', '/privacy/', '/contact/', '/guide/', '/types/', '/generations/']) {
    expect(pageMetadata(path).canonicalPath).toBe(path);
    expect(pageHead(path, 'https://example.test/').structuredData['@graph'].some(item => item['@type'] === 'Article')).toBe(false);
  }
});

test('escapes script boundaries while keeping structured data valid JSON', () => {
  const value = { description: '</script><script>alert(1)</script>' };
  const encoded = serializeStructuredData(value);
  expect(encoded).not.toContain('<');
  expect(JSON.parse(encoded)).toEqual(value);
});
