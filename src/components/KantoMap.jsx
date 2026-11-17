import { Button } from './ui/button';
import { useState } from 'react';

const routes = [
  [2, 10], [2, 6], [4, 3], [8, 2], [10, 3], [10, 8], [8, 5], [13, 5], [13, 2],
  [14, 4], [12, 9], [14, 9], [13, 11], [11, 12], [10, 13], [5, 5], [4, 8],
  [6, 13], [6, 15], [4, 15], [2, 13], [0, 8], [0, 6], [10, 1], [11, 0],
];
const points = {
  ...Object.fromEntries(routes.map((point, index) => [`kanto-route-${index + 1}`, point])),
  'pallet-town': [2, 11], 'viridian-city': [2, 8], 'pewter-city': [2, 3],
  'cerulean-city': [10, 2], 'lavender-town': [14, 5], 'vermilion-city': [10, 9],
  'celadon-city': [7, 5], 'fuchsia-city': [8, 13], 'cinnabar-island': [2, 15], 'saffron-city': [10, 5],
  'viridian-forest': [2, 4], 'mt-moon': [6, 2], 'rock-tunnel': [14, 3],
  'kanto-power-plant': [15, 4], 'pokemon-tower': [15, 5], 'kanto-safari-zone': [8, 12],
  'seafoam-islands': [5, 15], 'pokemon-mansion': [2, 15], 'cerulean-cave': [9, 1],
  'kanto-victory-road-1': [0, 4], 'kanto-victory-road-2': [0, 4],
  'digletts-cave': [3, 4],
};

export default function KantoMap({ records }) {
  const [selection, setSelection] = useState(null);
  const locations = new Map();
  for (const record of records) {
    if (!Object.hasOwn(points, record.location)) {
      continue;
    }
    const key = points[record.location].join(',');
    const position = locations.get(key) ?? { coordinates: points[record.location], names: new Set() };
    position.names.add(record.name);
    locations.set(key, position);
  }
  if (!locations.size) {
    return null;
  }
  const selected = locations.get(selection);

  return (
    <section className="kanto-map" aria-label="관동 출현 지도">
      <h3>관동 출현 지도</h3>
      <div className="kanto-map__grid">
        {[...locations].map(([key, { coordinates: [x, y], names }], index) => (
          <Button key={key} type="button" className="kanto-map__marker" style={{ left: `${6 + x / 15 * 88}%`, top: `${6 + y / 15 * 88}%` }}
            aria-label={[...names].join(', ')} aria-pressed={key === selection} onClick={() => setSelection(key)}>
            {index + 1}
          </Button>
        ))}
      </div>
      {selected && <p role="status">{[...selected.names].join(' · ')}</p>}
      <ol>{[...locations.values()].map(({ coordinates, names }) => (
        <li key={coordinates.join(',')}>{[...names].join(' · ')}</li>
      ))}</ol>
      <a href="https://github.com/pret/pokered/blob/ba9c0568f64ae602fadda577a08c66639f93082a/data/maps/town_map_entries.asm">타운맵 좌표 출처</a>
    </section>
  );
}
