import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { koreanName, pokemonOptions, speciesOptions } from '../api/pokeApi';
import { formatPokemonNumber } from '../pokemonNumber';
import RequestError from './RequestError';

export default function PokeCard({ entry }) {
  const pokemon = useQuery(pokemonOptions(entry.id));
  const species = useQuery(speciesOptions(pokemon.data));
  const error = [pokemon, species].find((query) => query.isError);
  const name = koreanName(species.data) ?? entry.name;
  const number = formatPokemonNumber(entry.id);

  if (error) {
    return (
      <div className="pokemon-card pokemon-card--error">
        <span>{number} {name}</span>
        <RequestError
          message="카드 정보를 불러오지 못했어요."
          retry={() => error.refetch()}
          retrying={error.isFetching}
        />
      </div>
    );
  }

  return (
    <Link
      className="pokemon-card"
      to={`/pokemon/${entry.id}`}
      state={{ fromList: true }}
      aria-label={`${number} ${name}`}
    >
      <span className="pokemon-card__media">
        <span className="pokemon-card__faces">
          <span className="pokemon-card__front">
            {pokemon.data?.sprites.front_default && (
              <img src={pokemon.data.sprites.front_default} alt="" loading="lazy" />
            )}
          </span>
          <span className="pokemon-card__back" aria-hidden="true" />
        </span>
      </span>
      <span className="pokemon-card__label">
        <span className="pokemon-card__number">{number}</span>
        <strong>{name}</strong>
      </span>
    </Link>
  );
}
