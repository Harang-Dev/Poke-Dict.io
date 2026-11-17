import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatPokemonNumber } from '../pokemonNumber';
import PokemonSprite from './PokemonSprite';

export default function PokeCard({ entry, fromList = false }) {
  const [flipped, setFlipped] = useState(false);
  const number = formatPokemonNumber(entry.number);

  return (
    <div className="card-tile">
      <Link
        className="pokemon-card"
        data-flipped={flipped}
        to={`/pokemon/${entry.id}`}
        state={fromList ? { fromList: true } : undefined}
        aria-label={`${number} ${entry.name}`}
      >
        <CardFaces front={(
          <>
            <span className="pokemon-card__media"><PokemonSprite key={entry.id} entry={entry} /></span>
            <span className="pokemon-card__label">
              <span className="pokemon-card__number">{number}</span>
              <strong>{entry.name}</strong>
            </span>
          </>
        )} />
      </Link>
      <button type="button" className="card-toggle" onClick={() => setFlipped(!flipped)}
        aria-label={`${entry.name} 카드 뒤집기`} aria-pressed={flipped}>
        {flipped ? '앞면 보기' : '카드 뒤집기'}
      </button>
    </div>
  );
}

export function CardFaces({ front, back }) {
  return (
    <span className="pokemon-card__faces">
      <span className="pokemon-card__front">{front}</span>
      <span className={back ? 'pokemon-card__back pokemon-card__back--content' : 'pokemon-card__back'} aria-hidden="true">
        {back}
      </span>
    </span>
  );
}
