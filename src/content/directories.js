import { entries, generations, typeNames } from '../dex/catalogue.js';

export function directoryPath(kind, value) {
  return `/${kind}/${value == null ? '' : `${value}/`}`;
}

export function directoryPage(kind, value) {
  const byType = kind === 'types';
  const options = byType ? Object.entries(typeNames) : generations.map((generation) => [String(generation), `${generation}세대`]);
  if (value == null) {
    return {
      title: byType ? '타입별 포켓몬 도감' : '세대별 포켓몬 도감',
      description: byType ? '18가지 타입별로 포켓몬과 폼을 찾아보고 상세의 기본 상성과 스탯을 확인하세요.' : '등장 종의 세대별로 포켓몬과 폼을 찾아보고 한국어 도감에서 비교·수집으로 이어가세요.',
      options,
    };
  }
  const option = options.find(([id]) => id === value);
  if (!option) return null;
  const matches = entries.filter((entry) => byType ? entry.types.includes(value) : String(entry.generation) === value);
  const species = new Set(matches.map((entry) => entry.number)).size;
  return {
    title: `${option[1]}${byType ? ' 타입' : ''} 포켓몬 도감`,
    description: `${option[1]}${byType ? ' 타입의' : '에 등장한 종의'} 포켓몬 ${species}종, 폼 포함 ${matches.length}개 항목입니다. 이름을 선택하면 기본 스탯과 약점을 확인하고 비교·컬렉션으로 이어갈 수 있습니다.`,
    note: byType ? '복합 타입 포켓몬도 포함됩니다. 방어 약점은 다른 타입과의 조합에 따라 달라지므로 각 폼의 상세에서 확인하세요.' : '세대는 종의 첫 등장 기준이며 해당 게임의 출현·사용 가능 목록이 아닙니다. 이후에 추가된 폼도 같은 종의 세대 아래에 표시됩니다.',
    options,
    entries: matches,
  };
}
