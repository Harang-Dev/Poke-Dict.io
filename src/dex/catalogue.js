import catalogue from '../data/catalogue.json';

export const { pokemon: entries, types: typeNames } = catalogue;
export const statNames = ['체력', '공격', '방어', '특수공격', '특수방어', '스피드'];
export const defaultEntries = entries.filter((entry) => entry.default);
export const generations = [...new Set(entries.map((entry) => entry.generation))].sort((a, b) => a - b);
export const entryById = new Map(entries.map((entry) => [entry.id, entry]));
export const speciesByNumber = new Map(defaultEntries.map((entry) => [entry.number, entry]));
const entriesByNumber = new Map();
for (const entry of entries) {
  const forms = entriesByNumber.get(entry.number) ?? [];
  forms.push(entry);
  entriesByNumber.set(entry.number, forms);
}

export function formsOf(number) {
  return entriesByNumber.get(number) ?? [];
}

export function spriteUrl(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

export function normalizeSearch(text) {
  return text.normalize('NFKC').trim().toLowerCase().replace(/[\s·-]/g, '');
}

const searchNames = new Map(entries.map((entry) => [
  entry.id,
  [entry.name, entry.speciesName, entry.slug].map(normalizeSearch),
]));

export function matchesPokemon(entry, query) {
  const term = normalizeSearch(query).replace(/^#/, '');
  if (!term) {
    return true;
  }
  return /^\d+$/.test(term)
    ? entry.number === Number(term) || entry.id === String(Number(term))
    : searchNames.get(entry.id).some((name) => name.includes(term));
}

export function statTotal(entry) {
  return entry.stats.some((value) => value == null) ? null : entry.stats.reduce((sum, value) => sum + value, 0);
}

export function defenseMultiplier(entry, attackType) {
  if (!Object.hasOwn(typeNames, attackType) || !entry.types.length || entry.types.some((type) => !Object.hasOwn(typeNames, type))) {
    return null;
  }
  return entry.types.reduce((multiplier, type) => multiplier * (catalogue.damage[type]?.[attackType] ?? 1), 1);
}

const nameOrder = new Intl.Collator('ko');
const sorters = {
  name: (first, second) => nameOrder.compare(first.name, second.name),
  height: (first, second) => (second.height ?? -1) - (first.height ?? -1),
  weight: (first, second) => (second.weight ?? -1) - (first.weight ?? -1),
  stats: (first, second) => (statTotal(second) ?? -1) - (statTotal(first) ?? -1),
};

export function findPokemon({ query = '', type = '', generation = '', weakness = '', sort = '', onlyCaught, caught = [] }) {
  const caughtNumbers = new Set(caught);
  const matches = entries.filter((entry) => (
    matchesPokemon(entry, query)
    && (!type || entry.types.includes(type))
    && (!generation || entry.generation === Number(generation))
    && (!weakness || defenseMultiplier(entry, weakness) > 1)
    && (!onlyCaught || caughtNumbers.has(String(entry.number)) === (onlyCaught === 'caught'))
  ));
  return Object.hasOwn(sorters, sort) ? matches.sort(sorters[sort]) : matches;
}

export function parsePokemonIds(value, limit) {
  return [...new Set((value ?? '').split(','))].filter((id) => entryById.has(id)).slice(0, limit);
}
