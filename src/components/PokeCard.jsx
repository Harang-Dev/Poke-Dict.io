import { pokemonPath } from '../paths';
import { Link } from 'react-router-dom';
import { formatPokemonNumber } from '../pokemonNumber';
import PokemonSprite from './PokemonSprite';

export default function PokeCard({ entry, fromList = false }) {
  const number = formatPokemonNumber(entry.number);

  return (
    <Link
      className="pokemon-card"
      to={pokemonPath(entry.id)}
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
