import { entryById, typeNames } from './dex/catalogue.js';
import { movePath } from './paths.js';
import { formatPokemonNumber } from './pokemonNumber.js';

const siteName = 'Poke-Dict';
export const dataSources = [
  ['PokéAPI', 'https://pokeapi.co/'],
  ['도감 데이터 리비전', 'https://github.com/PokeAPI/pokeapi/tree/8d8a49d9295bbc951d882004570ca496866fd9d8/data/v2/csv'],
];
const pages = new Map([
  ['/', ['포켓몬 도감', '포켓몬의 한국어 이름, 타입, 특성, 기본 스탯을 찾아보는 포켓몬 도감입니다.', true]],
  ['/moves/', ['기술 도감', '포켓몬 기술의 타입, 위력, 명중률, PP를 찾아보는 기술 도감입니다.', true]],
  ['/collection/', ['내 컬렉션']],
  ['/compare/', ['포켓몬 비교']],
  ['/quiz/', ['오늘의 실루엣']],
  ['/team/', ['내 팀']],
  ['/binder/', ['공유 바인더']],
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
    };
  }
  if (move && path === movePath(move.id)) {
    return {
      title: `${move.name} | ${siteName} 기술 도감`,
      description: `${move.name} · ${typeLabel(move.type)} 타입 기술. 기본 위력, 명중률, PP와 배울 수 있는 포켓몬을 확인하세요.`,
      canonicalPath: path,
    };
  }
  const [name, description = '', indexable] = pages.get(path) ?? ['페이지를 찾을 수 없어요'];
  return { title: `${name} | ${siteName}`, description, canonicalPath: indexable ? path : null };
}
