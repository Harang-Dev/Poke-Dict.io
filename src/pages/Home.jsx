import { useCallback, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { findPokemon, entryById, generations, statTotal, typeNames } from '../dex/catalogue';
import { useCollection } from '../dex/collection';
import PokeCard from '../components/PokeCard';
import PokeCardList, { pageSize } from '../components/PokeCardList';
import ShareLink from '../components/ShareLink';
import { formatPokemonNumber } from '../pokemonNumber';

export default function Home() {
  const [params, setParams] = useSearchParams();
  const { data } = useCollection();
  const [drawn, setDrawn] = useState(null);
  const query = params.get('q')?.slice(0, 80) ?? '';
  const type = params.get('type') ?? '';
  const generation = params.get('gen') ?? '';
  const weakness = params.get('weakness') ?? '';
  const sort = params.get('sort') ?? '';
  const caught = params.get('caught') ?? '';
  const table = params.get('view') === 'table';
  const page = Math.max(1, Math.min(100, Number.parseInt(params.get('page'), 10) || 1));

  const matches = useMemo(() => findPokemon({
    query, type, generation, weakness, sort, onlyCaught: caught, caught: data.caught,
  }), [query, type, generation, weakness, sort, caught, data.caught]);

  function setFilter(key, value) {
    const next = new URLSearchParams(params);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.delete('page');
    setParams(next, { replace: true });
    setDrawn(null);
  }

  const more = useCallback(() => {
    const next = new URLSearchParams(params);
    next.set('page', String(page + 1));
    setParams(next, { replace: true });
  }, [page, params, setParams]);

  const recent = data.recent.map((id) => entryById.get(id)).filter(Boolean);
  const shared = new URLSearchParams(Object.entries({
    q: query, type, gen: generation, weakness, sort, view: table ? 'table' : '',
  }).filter(([, value]) => value));

  return (
    <main className="home">
      <header className="home-hero">
        <h1 className="home__title">POKE-DICT</h1>
        <p>포켓몬을 찾고, 카드를 뒤집고, 나만의 도감을 모아보세요.</p>
      </header>
      <section className="panel dex-search" aria-label="도감 검색">
        <label className="dex-search__main">
          포켓몬 검색
          <input type="search" placeholder="피카츄, pikachu, 025" value={query} maxLength={80}
            onChange={(event) => setFilter('q', event.target.value)} />
        </label>
        <div className="filter-row">
          <TypeSelect label="타입" value={type} onChange={(value) => setFilter('type', value)} />
          <label>세대
            <select value={generation} onChange={(event) => setFilter('gen', event.target.value)}>
              <option value="">모든 세대</option>
              {generations.map((gen) => <option key={gen} value={gen}>{gen}세대</option>)}
            </select>
          </label>
          <TypeSelect label="약점" value={weakness} onChange={(value) => setFilter('weakness', value)} />
          <label>정렬
            <select value={sort} onChange={(event) => setFilter('sort', event.target.value)}>
              <option value="">도감 번호순</option>
              <option value="name">이름순</option>
              <option value="height">키 큰 순</option>
              <option value="weight">몸무게 무거운 순</option>
              <option value="stats">기본 스탯 합계 높은 순</option>
            </select>
          </label>
          <label>수집 상태
            <select value={caught} onChange={(event) => setFilter('caught', event.target.value)}>
              <option value="">전체</option>
              <option value="caught">잡은 포켓몬</option>
              <option value="missing">미등록</option>
            </select>
          </label>
        </div>
        <div className="action-row">
          <button type="button" aria-pressed={table} onClick={() => setFilter('view', table ? '' : 'table')}>
            {table ? '카드 보기' : '표 보기'}
          </button>
          <button type="button" disabled={!matches.length}
            onClick={() => setDrawn(matches[Math.floor(Math.random() * matches.length)])}>랜덤 카드 뽑기</button>
          <ShareLink to={{ pathname: '/', search: shared.toString() }}>검색 조건 공유</ShareLink>
        </div>
      </section>
      {recent.length > 0 && (
        <section className="recent-cards" aria-labelledby="recent-heading">
          <h2 id="recent-heading">최근 본 카드</h2>
          <ul>{recent.map((item) => <li key={item.id}><Link to={`/pokemon/${item.id}`}>{item.name}</Link></li>)}</ul>
        </section>
      )}
      {drawn && (
        <section className="drawn-card" aria-label="뽑은 카드">
          <h2>뽑은 카드</h2>
          <PokeCard key={drawn.id} entry={drawn} fromList />
        </section>
      )}
      <p className="results-count" role="status">{matches.length.toLocaleString('ko-KR')}개 항목</p>
      {table ? (
        <PokemonTable matches={matches} count={page * pageSize} showMore={more} />
      ) : (
        <PokeCardList entries={matches} fromList shown={page * pageSize} onShowMore={more} />
      )}
    </main>
  );
}

function TypeSelect({ label, value, onChange }) {
  return (
    <label>{label}
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">전체</option>
        {Object.entries(typeNames).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
      </select>
    </label>
  );
}

function PokemonTable({ matches, count, showMore }) {
  if (!matches.length) {
    return <p role="status">표시할 포켓몬이 없어요.</p>;
  }
  return (
    <>
      <div className="table-scroll" tabIndex={0} role="region" aria-label="포켓몬 표">
        <table>
          <thead><tr>
            <th scope="col">번호</th><th scope="col">이름</th><th scope="col">타입</th>
            <th scope="col">키</th><th scope="col">몸무게</th><th scope="col">기본 스탯 합계</th>
          </tr></thead>
          <tbody>{matches.slice(0, count).map((entry) => (
            <tr key={entry.id}>
              <td>{formatPokemonNumber(entry.number)}</td>
              <th scope="row"><Link to={`/pokemon/${entry.id}`} state={{ fromList: true }}>{entry.name}</Link></th>
              <td>{entry.types.map((type) => typeNames[type] ?? type).join(' · ')}</td>
              <td>{entry.height == null ? '—' : `${entry.height / 10} m`}</td>
              <td>{entry.weight == null ? '—' : `${entry.weight / 10} kg`}</td>
              <td>{statTotal(entry) ?? '—'}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {count < matches.length && <div className="list-status"><button type="button" onClick={showMore}>더 보기</button></div>}
    </>
  );
}
