export function formatPokemonNumber(id) {
  return `No. ${String(id).padStart(3, '0')}`;
}
