import { Button } from './ui/button';
import { Input } from './ui/input';
import { useState } from 'react';
import { entries, matchesPokemon } from '../dex/catalogue';
import { formatPokemonNumber } from '../pokemonNumber';

export default function PokemonPicker({ onPick, options = entries, excluded = [], label = '포켓몬 선택' }) {
  const [query, setQuery] = useState('');
  const term = query.trim();
  const matches = term ? options.filter((entry) => !excluded.includes(entry.id) && matchesPokemon(entry, term)).slice(0, 8) : [];

  return (
    <div className="pokemon-picker">
      <label>{label}<Input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="이름 또는 도감 번호" /></label>
      {term && matches.length === 0 && <p role="status">선택할 포켓몬이 없어요.</p>}
      {matches.length > 0 && (
        <ul>
          {matches.map((entry) => (
            <li key={entry.id}>
              <Button type="button" onClick={() => { onPick(entry.id); setQuery(''); }}>
                {formatPokemonNumber(entry.number)} {entry.name}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
