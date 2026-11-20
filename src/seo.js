import { entryById, typeNames } from './dex/catalogue.js';
import { movePath } from './paths.js';
import { formatPokemonNumber } from './pokemonNumber.js';
import { articleBySlug, catalogueSource, editorialDate } from './content/learning.js';
import { informationPages } from './content/information.js';
import { directoryPage } from './content/directories.js';

const siteName = 'Poke-Dict';
export const dataSources = [
  ['PokéAPI', 'https://pokeapi.co/'],
  ['도감 데이터 리비전', 'https://github.com/PokeAPI/pokeapi/tree/8d8a49d9295bbc951d882004570ca496866fd9d8/data/v2/csv'],
];
const pages = new Map([
  ['/', ['한국어 포켓몬 도감 · 약점·종족값·폼 비교', '한국어·영어 이름과 도감 번호로 포켓몬을 찾고 타입·세대·약점을 확인하세요. 폼별 비교, 팀 방어 상성과 브라우저 컬렉션을 함께 제공합니다.', true]],
  ['/moves/', ['기술 도감', '포켓몬 기술의 타입, 위력, 명중률, PP를 찾아보는 기술 도감입니다.', true]],
  ['/collection/', ['내 컬렉션']],
  ['/compare/', ['포켓몬 비교']],
  ['/quiz/', ['오늘의 실루엣']],
  ['/team/', ['내 팀']],
  ['/binder/', ['공유 바인더']],
  ['/guide/', ['이용 및 데이터 안내', 'Poke-Dict의 브라우저 기록 보관, 백업, 공유 링크와 외부 데이터 이용 안내입니다.', true]],
  ['/learn/', ['포켓몬 도감 활용 가이드', '타입 상성, 종족값, 폼별 수집, 팀의 공통 약점과 게임 버전별 기술·출현 정보를 실제 예시로 설명합니다.', true]],
]);

export const typeLabel = (type) => typeNames[type] ?? type;

export function pageMetadata(pathname, move) {
  const path = pathname.endsWith('/') ? pathname : pathname + '/';
  const pokemon = entryById.get(path.match(/^\/pokemon\/(\d+)\/$/)?.[1]);
  if (pokemon) {
    const number = formatPokemonNumber(pokemon.number);
    return {
      title: `${pokemon.name} (${number}) | ${siteName} 포켓몬 도감`,
      description: `${pokemon.name} (${number}) · ${pokemon.generation}세대 · ${pokemon.types.map(typeLabel).join('·')} 타입. 기본 스탯, 특성, 방어 상성과 게임별 습득 기술을 확인하세요.`,
      canonicalPath: path,
      breadcrumbs: [{ name: '포켓몬 도감', path: '/' }, { name: pokemon.name, path }],
    };
  }
  if (move && path === movePath(move.id)) {
    return {
      title: `${move.name} | ${siteName} 기술 도감`,
      description: `${move.name} · ${typeLabel(move.type)} 타입 기술. 기본 위력, 명중률, PP와 배울 수 있는 포켓몬을 확인하세요.`,
      canonicalPath: path,
      breadcrumbs: [{ name: '포켓몬 도감', path: '/' }, { name: '기술 도감', path: '/moves/' }, { name: move.name, path }],
    };
  }
  const article = articleBySlug.get(path.match(/^\/learn\/([^/]+)\/$/)?.[1]);
  if (article) {
    return {
      title: `${article.title} | ${siteName}`, description: article.description, canonicalPath: path, article,
      breadcrumbs: [{ name: '포켓몬 도감', path: '/' }, { name: '도감 활용 가이드', path: '/learn/' }, { name: article.title, path }],
    };
  }
  const directory = path.match(/^\/(types|generations)\/(?:([^/]+)\/)?$/);
  if (directory) {
    const page = directoryPage(directory[1], directory[2]);
    if (page) {
      const parentPath = `/${directory[1]}/`;
      return {
        title: `${page.title} | ${siteName}`, description: page.description, canonicalPath: path,
        breadcrumbs: [{ name: '포켓몬 도감', path: '/' },
          ...(directory[2] ? [{ name: directoryPage(directory[1]).title, path: parentPath }] : []),
          { name: page.title, path }],
      };
    }
  }
  const informationKey = path.slice(1, -1);
  const information = Object.hasOwn(informationPages, informationKey) ? informationPages[informationKey] : undefined;
  if (information) {
    return {
      title: `${information.title} | ${siteName}`, description: information.description, canonicalPath: path,
      breadcrumbs: [{ name: '포켓몬 도감', path: '/' }, { name: information.title, path }],
    };
  }
  const [name, description = '', indexable] = pages.get(path) ?? ['페이지를 찾을 수 없어요'];
  return {
    title: `${name} | ${siteName}`, description, canonicalPath: indexable ? path : null,
    breadcrumbs: path === '/' ? [] : [{ name: '포켓몬 도감', path: '/' }, { name, path }],
  };
}

export function pageHead(pathname, baseUrl, move) {
  const metadata = pageMetadata(pathname, move);
  const url = new URL((metadata.canonicalPath ?? pathname).replace(/^\//, ''), baseUrl).href;
  const image = new URL('social-card.png', baseUrl).href;
  const social = [
    ['property', 'og:type', metadata.article ? 'article' : 'website'],
    ['property', 'og:site_name', siteName], ['property', 'og:locale', 'ko_KR'],
    ['property', 'og:title', metadata.title], ['property', 'og:description', metadata.description],
    ['property', 'og:url', url], ['property', 'og:image', image],
    ['property', 'og:image:width', '1200'], ['property', 'og:image:height', '630'],
    ['property', 'og:image:alt', 'Poke-Dict 한국어 포켓몬 도감과 컬렉션'],
    ['name', 'twitter:card', 'summary_large_image'], ['name', 'twitter:title', metadata.title],
    ['name', 'twitter:description', metadata.description], ['name', 'twitter:image', image],
  ];
  const graph = metadata.canonicalPath ? [
    { '@type': 'WebSite', '@id': `${baseUrl}#website`, url: baseUrl, name: siteName, inLanguage: 'ko' },
    { '@type': 'WebPage', '@id': `${url}#page`, url, name: metadata.title, description: metadata.description,
      inLanguage: 'ko', isPartOf: { '@id': `${baseUrl}#website` },
      ...(/^\/(pokemon|moves)\/\d+\/?$/.test(pathname) ? { citation: catalogueSource } : {}) },
  ] : [];
  if (graph.length && metadata.breadcrumbs.length > 1) {
    graph.push({ '@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`, itemListElement: metadata.breadcrumbs.map(({ name, path }, index) => ({
      '@type': 'ListItem', position: index + 1, name, item: new URL(path.slice(1), baseUrl).href,
    })) });
    graph[1].breadcrumb = { '@id': `${url}#breadcrumb` };
  }
  if (metadata.article) {
    graph.push({ '@type': 'Article', '@id': `${url}#article`, headline: metadata.article.title,
      description: metadata.description, inLanguage: 'ko', datePublished: editorialDate, dateModified: editorialDate,
      author: { '@type': 'Organization', name: 'Poke-Dict', url: new URL('about/', baseUrl).href },
      mainEntityOfPage: { '@id': `${url}#page` }, citation: catalogueSource, image });
  }
  return { ...metadata, url, image, social, structuredData: graph.length ? { '@context': 'https://schema.org', '@graph': graph } : null };
}

export function serializeStructuredData(value) {
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}
