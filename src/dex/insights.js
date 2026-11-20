import { defenseMultiplier, statNames, statTotal, typeNames } from './catalogue.js';

export function pokemonInsights(entry) {
  const types = entry.types.map((type) => typeNames[type] ?? type).join('·');
  const intro = `${entry.name}의 전국도감 번호는 No. ${String(entry.number).padStart(3, '0')}이며, 기본 타입은 ${types || '확인되지 않은 타입'}입니다. ${entry.generation}세대에 등장한 종의 ${entry.default ? '기본 폼' : '다른 폼'}입니다.`;
  const weaknesses = Object.keys(typeNames).flatMap((type) => {
    const multiplier = defenseMultiplier(entry, type);
    return multiplier > 1 ? [`${typeNames[type]} ${multiplier}배`] : [];
  });
  const weaknessText = !entry.types.length ? '타입 상성 데이터가 없습니다.'
    : weaknesses.length ? `기본 타입 기준 약점은 ${weaknesses.join(', ')}입니다.` : '기본 타입 기준으로 1배를 초과하는 약점이 없습니다.';
  const total = statTotal(entry);
  const maximum = Math.max(...entry.stats);
  const highest = entry.stats.flatMap((value, index) => value === maximum ? [statNames[index]] : []);
  const statText = total == null ? '기본 스탯이 모두 제공되지 않아 합계를 표시하지 않습니다.'
    : `기본 스탯(종족값) 합계는 ${total}이며, 가장 높은 항목은 ${highest.join('·')}(${maximum})입니다. 실제 능력치는 레벨과 육성 조건에 따라 달라집니다.`;
  return { intro, weaknessText, statText };
}

export const matchupScope = '상성은 기본 타입만 계산하며 특성·도구·필드·테라스탈은 반영하지 않습니다. 과거 게임의 타입표나 기본 스탯을 재현하는 기능은 아닙니다.';

export function moveSummary(move) {
  const power = move.power == null ? '제공되는 수치 없음' : String(move.power);
  const accuracy = move.accuracy == null ? '제공되는 수치 없음' : `${move.accuracy}%`;
  return `${move.name}: ${typeNames[move.type] ?? move.type} 타입 기술입니다. 기본 위력 ${power}, 명중률 ${accuracy}, PP ${move.pp ?? '제공되는 수치 없음'}입니다.`;
}

export const moveScope = '위력·명중률·PP는 데이터의 기본값입니다. 수치가 없다고 0을 뜻하지 않으며 게임별 수치·효과와 습득 가능 여부는 다를 수 있습니다.';
