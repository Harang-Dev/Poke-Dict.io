import { Button } from '../components/ui/button';
import { lazy, Suspense, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { isPokemonId, koreanName, pokemonOptions, speciesOptions } from '../api/pokeApi';
import { defaultEntries, entryById } from '../dex/catalogue';
import { useCollection } from '../dex/collection';
import Disclosure from '../components/Disclosure';
import DetailEvolution from '../components/DetailEvolution';
import DetailImageBox from '../components/DetailImageBox';
import DetailTypeBox from '../components/DetailTypeBox';
import PokemonDescription from '../components/PokemonDescription';
import RequestError from '../components/RequestError';
import TypeMatchups from '../components/TypeMatchups';
import { formatPokemonNumber } from '../pokemonNumber';

const VersionDex = lazy(() => import('../components/VersionDex'));

export default function Detail() {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { visit } = useCollection();
  const entry = entryById.get(id);
  const heading = useRef(null);
  const pokemon = useQuery(pokemonOptions(id));
  const species = useQuery(speciesOptions(pokemon.data));
  const name = koreanName(species.data) ?? entry?.speciesName ?? pokemon.data?.name ?? '포켓몬 상세';
  const number = entry?.number ?? species.data?.id;

  useEffect(() => {
    heading.current?.focus();
  }, [id]);

  useEffect(() => {
    if (entry && pokemon.data) {
      visit(id);
    }
  }, [entry, id, pokemon.data, visit]);

  return (
    <main className="detail">
      {state?.fromList ? (
        <Button variant="link" className="detail__back" type="button" onClick={() => navigate(-1)}>← 도감 목록으로</Button>
      ) : (
        <Link className="detail__back" to="/">← 도감 목록으로</Link>
      )}
      <header className="detail__heading">
        <h1 tabIndex={-1} ref={heading}>{name}</h1>
        {(number != null || (entry && !entry.default)) && (
          <div className="section-heading">
            {number != null && <span className="meta-badge">{formatPokemonNumber(number)}</span>}
            {entry && !entry.default && <p className="meta-badge">{entry.name}</p>}
          </div>
        )}
      </header>
      <DetailContent id={id} entry={entry} number={number} name={name} pokemon={pokemon} species={species} />
    </main>
  );
}

function DetailContent({ id, entry, number, name, pokemon, species }) {
  if (!isPokemonId(id) || pokemon.error?.status === 404) {
    return <p role="status">포켓몬을 찾을 수 없어요.</p>;
  }

  if (pokemon.isError) {
    return <RequestError message="포켓몬 정보를 불러오지 못했어요."
      retry={() => pokemon.refetch()} retrying={pokemon.isFetching} />;
  }

  if (pokemon.isPending) {
    return <p role="status">포켓몬 정보를 불러오는 중…</p>;
  }

  return (
    <div className="section-stack">
      {entry && <CollectionActions entry={entry} />}
      {species.isError && (
        <RequestError message="한국어 도감 정보를 불러오지 못했어요."
          retry={() => species.refetch()} retrying={species.isFetching} />
      )}
      <div className="detail__grid">
        <div className="section-stack" key={id}>
          <DetailImageBox pokemon={pokemon.data} name={name} />
          {species.data && <PokemonDescription species={species.data} />}
        </div>
        <DetailTypeBox pokemon={pokemon.data} />
      </div>
      <TypeMatchups pokemon={pokemon.data} />
      <DetailEvolution id={id} number={number} species={species.data} />
      <GameDetails key={id} id={id} pokemon={pokemon.data} species={species.data} />
      {entry && <AdjacentPokemon number={entry.number} />}
    </div>
  );
}

function CollectionActions({ entry }) {
  const { data, toggle } = useCollection();
  const caughtId = String(entry.number);
  const favorite = data.favorites.includes(entry.id);
  const caught = data.caught.includes(caughtId);
  const shiny = data.shiny.includes(entry.id);
  return (
    <div className="action-row">
      <Button type="button" aria-pressed={favorite} onClick={() => toggle('favorites', entry.id)}>
        {favorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
      </Button>
      <Button type="button" aria-pressed={caught} onClick={() => toggle('caught', caughtId)}>
        {caught ? '잡은 기록 해제' : '잡은 포켓몬으로 등록'}
      </Button>
      <Button type="button" aria-pressed={shiny} onClick={() => toggle('shiny', entry.id)}>
        {shiny ? '색이 다른 모습 기록 해제' : '색이 다른 모습 등록'}
      </Button>
      <Button asChild><Link to={`/compare?pokemon=${entry.id}`}>포켓몬 비교</Link></Button>
    </div>
  );
}

function GameDetails({ id, pokemon, species }) {
  return (
    <Disclosure className="panel game-details" title="게임별 기술과 출현 정보">
      <Suspense fallback={<p role="status">게임 정보를 불러오는 중…</p>}>
        <VersionDex id={id} pokemon={pokemon} species={species} />
      </Suspense>
    </Disclosure>
  );
}

function AdjacentPokemon({ number }) {
  const index = defaultEntries.findIndex((entry) => entry.number === number);
  const previous = defaultEntries[index - 1];
  const next = defaultEntries[index + 1];
  return (
    <nav className="adjacent section-nav" aria-label="이전·다음 포켓몬">
      {previous && <Link to={`/pokemon/${previous.id}`}>← {formatPokemonNumber(previous.number)} {previous.name}</Link>}
      {next && <Link to={`/pokemon/${next.id}`}>{formatPokemonNumber(next.number)} {next.name} →</Link>}
    </nav>
  );
}
