import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { moveOptions } from '../api/pokeApi';
import { entryById, normalizeSearch, typeNames } from '../dex/catalogue';
import { moveById, moves, readableName } from '../dex/gameData';
import RequestError from '../components/RequestError';
import PokeCardList from '../components/PokeCardList';

export function MoveList() {
  const [params, setParams] = useSearchParams();
  const [count, setCount] = useState(25);
  const query = params.get('q')?.slice(0, 80) ?? '';
  const type = params.get('type') ?? '';
  const term = normalizeSearch(query);
  const found = moves.filter((move) => (!type || move.type === type) && (
    normalizeSearch(move.name).includes(term) || normalizeSearch(move.slug).includes(term)
  ));
  function update(key, value) {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setCount(25);
    setParams(next, { replace: true });
  }

  return (
    <main className="workspace">
      <h1>기술 도감</h1>
      <div className="panel filter-row">
        <label>기술 검색<input type="search" maxLength={80} value={query} onChange={(event) => update('q', event.target.value)} /></label>
        <label>타입<select value={type} onChange={(event) => update('type', event.target.value)}>
          <option value="">모든 타입</option>
          {Object.entries(typeNames).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select></label>
      </div>
      <p role="status">{found.length}개 기술</p>
      <p>수치는 PokéAPI 기술 도감 기본값 기준이에요.</p>
      {found.length > 0 && (
        <div className="table-scroll" tabIndex={0} role="region" aria-label="기술 목록">
          <table>
            <thead><tr><th scope="col">이름</th><th scope="col">타입</th><th scope="col">위력</th><th scope="col">명중률</th><th scope="col">PP</th></tr></thead>
            <tbody>{found.slice(0, count).map((move) => (
              <tr key={move.id}>
                <th scope="row"><Link to={`/moves/${move.id}`}>{move.name}</Link></th>
                <td>{typeNames[move.type] ?? move.type}</td>
                <td>{move.power ?? '—'}</td>
                <td>{move.accuracy == null ? '—' : `${move.accuracy}%`}</td>
                <td>{move.pp ?? '—'}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {count < found.length && <div className="list-status"><button type="button" onClick={() => setCount(count + 25)}>더 보기</button></div>}
    </main>
  );
}

export function MoveDetail() {
  const { id } = useParams();
  const summary = moveById.get(id);
  const query = useQuery({ ...moveOptions(id), enabled: Boolean(summary) });
  const data = query.data;
  const description = data?.flavor_text_entries?.find(({ language }) => language.name === 'ko')?.flavor_text
    ?? data?.effect_entries?.find(({ language }) => language.name === 'en')?.short_effect;
  const learners = (data?.learned_by_pokemon ?? []).map((pokemon) => (
    entryById.get(pokemon.url?.match(/\/pokemon\/(\d+)\/?$/)?.[1])
  )).filter(Boolean);

  return (
    <main className="workspace section-stack">
      <Link className="detail__back" to="/moves">← 기술 도감으로</Link>
      <h1>{summary?.name ?? '기술을 찾을 수 없어요.'}</h1>
      {summary && (
        <>
          <section className="panel">
            <p>수치는 PokéAPI 기술 도감 기본값 기준이에요. 게임에 따라 달라질 수 있어요.</p>
            <dl className="measurements">
              <div><dt>타입</dt><dd>{typeNames[summary.type] ?? summary.type}</dd></div>
              <div><dt>위력</dt><dd>{summary.power ?? '—'}</dd></div>
              <div><dt>명중률</dt><dd>{summary.accuracy == null ? '—' : `${summary.accuracy}%`}</dd></div>
              <div><dt>PP</dt><dd>{summary.pp ?? '—'}</dd></div>
              {data?.damage_class && <div><dt>분류</dt><dd>{({ physical: '물리', special: '특수', status: '변화' })[data.damage_class.name] ?? readableName(data.damage_class.name)}</dd></div>}
            </dl>
            {description && <p>{description.replace(/\s+/g, ' ').replace('$effect_chance', String(data.effect_chance ?? '—')).trim()}</p>}
            {query.isPending && <p role="status">기술 설명을 불러오는 중…</p>}
            {query.isError && <RequestError message="기술 상세를 불러오지 못했어요."
              retry={() => query.refetch()} retrying={query.isFetching} />}
          </section>
          {data && <section>
            <h2>배울 수 있는 포켓몬</h2>
            <p>PokéAPI에 등록된 게임 전체 기준이에요. 버전별 습득 방법은 각 포켓몬 상세에서 확인할 수 있어요.</p>
            <PokeCardList key={id} entries={learners} />
          </section>}
        </>
      )}
    </main>
  );
}
