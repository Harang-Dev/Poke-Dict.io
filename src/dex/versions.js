import versions from '../data/versions.json';

export { versions };
const names = new Map(versions.map(({ id, name }) => [id, name]));

export function gameVersionName(id) {
  const name = names.get(id) ?? id.replaceAll('-', ' ');
  return id.endsWith('-japan') ? `${name} (일본판)` : name;
}
