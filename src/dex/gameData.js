import games from '../data/games.json';

export const { moves, areas, learnMethods } = games;
export const moveBySlug = new Map(moves.map((move) => [move.slug, move]));
export const moveById = new Map(moves.map((move) => [move.id, move]));

export function locationLabel(area) {
  const id = area.url?.match(/\/location-area\/(\d+)\/?$/)?.[1];
  const [location, section, label] = areas[id] ?? [area.name, '', area.name];
  const route = location.match(/^kanto-route-(\d+)$/)?.[1];
  const name = route ? `${route}번도로` : readableName(label);
  return { location, name: section && section !== location ? `${name} · ${readableName(section)}` : name };
}

export function readableName(name = '') {
  return name.replaceAll('-', ' ');
}

const methodLabels = {
  walk: '걷기', surf: '파도타기', 'old-rod': '낡은낚싯대', 'good-rod': '좋은낚싯대',
  'super-rod': '대단한낚싯대', 'rock-smash': '바위깨기', headbutt: '박치기', gift: '선물',
  'gift-egg': '알 선물', static: '고정 출현', 'npc-trade': 'NPC와 교환', overworld: '필드 출현',
};
const conditionLabels = {
  'time-morning': '아침', 'time-day': '낮', 'time-night': '밤', 'swarm-yes': '대량발생 중', 'swarm-no': '대량발생 외',
  'radar-on': '포켓트레 사용', 'radar-off': '포켓트레 미사용',
  'season-spring': '봄', 'season-summer': '여름', 'season-autumn': '가을', 'season-winter': '겨울',
};

export function encounterMethodLabel(id) {
  return methodLabels[id] ?? games.encounterMethods[id] ?? readableName(id);
}

export function encounterConditionLabel(id) {
  return conditionLabels[id] ?? games.encounterConditions[id] ?? readableName(id);
}
