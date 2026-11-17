import versions from '../data/versions.json';

export { versions };
const names = new Map(versions.map(({ id, name }) => [id, name]));

export function gameVersionName(id) {
  return names.get(id) ?? id.replaceAll('-', ' ');
}
