import { useState } from 'react';
import SelectField from './SelectField';
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
    <section className="panel" aria-label="도감 설명">
      {descriptions.size ? (
        <>
          <SelectField label="도감 설명 버전" value={version} onChange={setSelected}
            options={[...descriptions.keys()].map((id) => [id, gameVersionName(id)])} />
          <p>{descriptions.get(version)}</p>
        </>
      ) : <p>한국어 도감 설명이 없어요.</p>}
    </section>
  );
}
