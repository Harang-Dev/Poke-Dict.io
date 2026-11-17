import { useState } from 'react';
import { gameVersionName } from '../dex/versions';

export default function PokemonDescription({ species }) {
  const [selected, setSelected] = useState('');
  const descriptions = new Map();
  for (const entry of species?.flavor_text_entries ?? []) {
    if (entry.language.name === 'ko' && entry.flavor_text.trim()) {
      descriptions.set(entry.version.name, entry.flavor_text.replace(/\s+/g, ' ').trim());
    }
  }
  const version = descriptions.has(selected) ? selected : descriptions.keys().next().value;

  return (
    <section className="panel">
      <h2>도감 설명</h2>
      {descriptions.size ? (
        <>
          <label>도감 설명 버전<select value={version} onChange={(event) => setSelected(event.target.value)}>
            {[...descriptions.keys()].map((id) => <option key={id} value={id}>{gameVersionName(id)}</option>)}
          </select></label>
          <p>{descriptions.get(version)}</p>
        </>
      ) : <p>한국어 도감 설명이 없어요.</p>}
    </section>
  );
}
