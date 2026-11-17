import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { isPokemonId, koreanName, pokemonOptions, speciesOptions } from '../api/pokeApi';
import DetailImageBox from '../components/DetailImageBox';
import DetailTypeBox from '../components/DetailTypeBox';
import RequestError from '../components/RequestError';
import { formatPokemonNumber } from '../pokemonNumber';

export default function Detail() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const heading = useRef(null);
  const pokemon = useQuery(pokemonOptions(id));
  const species = useQuery(speciesOptions(pokemon.data));

  useEffect(() => {
    heading.current?.focus();
  }, [id]);

  return (
    <main className="detail">
      {state?.fromList ? (
        <button className="detail__back" type="button" onClick={() => navigate(-1)}>← 도감 목록으로</button>
      ) : (
        <Link className="detail__back" to="/">← 도감 목록으로</Link>
      )}
      <header className="detail__heading">
        {isPokemonId(id) && <p>{formatPokemonNumber(id)}</p>}
        <h1 tabIndex={-1} ref={heading}>
          {koreanName(species.data) ?? pokemon.data?.name ?? '포켓몬 상세'}
        </h1>
      </header>
      <DetailContent id={id} pokemon={pokemon} species={species} />
    </main>
  );
}

function DetailContent({ id, pokemon, species }) {
  if (!isPokemonId(id) || pokemon.error?.status === 404) {
    return <p role="status">포켓몬을 찾을 수 없어요.</p>;
  }

  if (pokemon.isError) {
    return (
      <RequestError
        message="포켓몬 정보를 불러오지 못했어요."
        retry={() => pokemon.refetch()}
        retrying={pokemon.isFetching}
      />
    );
  }

  if (pokemon.isPending) {
    return <p role="status">포켓몬 정보를 불러오는 중…</p>;
  }

  return (
    <>
      {species.isError && (
        <RequestError
          message="한국어 이름을 불러오지 못했어요."
          retry={() => species.refetch()}
          retrying={species.isFetching}
        />
      )}
      <div className="detail__grid">
        <DetailImageBox pokemon={pokemon.data} name={koreanName(species.data) ?? pokemon.data.name} />
        <DetailTypeBox pokemon={pokemon.data} />
      </div>
    </>
  );
}
