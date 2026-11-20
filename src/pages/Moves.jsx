import { movePath } from '../paths';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { moveOptions } from '../api/pokeApi';
import { entryById, normalizeSearch, typeNames } from '../dex/catalogue';
import { moveById, moves, readableName } from '../dex/gameData';
import SelectField from '../components/SelectField';
import RequestError from '../components/RequestError';
import PokeCardList from '../components/PokeCardList';
import EmptyState from '../components/EmptyState';
import Breadcrumbs from '../components/Breadcrumbs';
import { pageMetadata } from '../seo';
import { moveScope, moveSummary } from '../dex/insights';

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
    <main className="workspace page-column">
      <Breadcrumbs items={pageMetadata('/moves/').breadcrumbs} />
      <header className="section-heading">
        <h1>기술 도감</h1>
        <span className="meta-badge" role="status">{found.length}개 기술</span>
      </header>
      <div className="panel filter-row">
        <label>기술 검색<Input type="search" maxLength={80} value={query} onChange={(event) => update('q', event.target.value)} /></label>
        <SelectField label="타입" value={type} onChange={(value) => update('type', value)}
          options={[['', '모든 타입'], ...Object.entries(typeNames)]} />
      </div>
      {found.length === 0 ? (
        <EmptyState title="검색 결과가 없어요."
          description={<>검색어나 타입을 바꾸거나<br />전체 기술을 다시 둘러보세요.</>}>
          <Button variant="default" onClick={() => {
            const next = new URLSearchParams(params);
            next.delete('q');
            next.delete('type');
            setCount(25);
            setParams(next, { replace: true });
          }}>검색 조건 초기화</Button>
        </EmptyState>
      ) : (
        <div className="table-scroll" tabIndex={0} role="region" aria-label="기술 목록">
          <table>
            <thead><tr><th scope="col">이름</th><th scope="col">타입</th><th scope="col">위력</th><th scope="col">명중률</th><th scope="col">PP</th></tr></thead>
            <tbody>{found.slice(0, count).map((move) => (
              <tr key={move.id}>
                <th scope="row"><Link to={movePath(move.id)}>{move.name}</Link></th>
                <td><span className="type-badge" data-type={move.type}>{typeNames[move.type] ?? move.type}</span></td>
                <td>{move.power ?? '—'}</td>
                <td>{move.accuracy == null ? '—' : `${move.accuracy}%`}</td>
                <td>{move.pp ?? '—'}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {count < found.length && <div className="list-status"><Button type="button" onClick={() => setCount(count + 25)}>더 보기</Button></div>}
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
      {summary && <Breadcrumbs items={pageMetadata(movePath(id), summary).breadcrumbs} />}
      <Link className="detail__back" to="/moves/">← 기술 도감으로</Link>
      <header className="section-heading">
        <h1>{summary?.name ?? '기술을 찾을 수 없어요.'}</h1>
        {summary && <span className="type-badge" data-type={summary.type}>{typeNames[summary.type] ?? summary.type}</span>}
      </header>
      {summary && <section className="panel"><h2>기술 한눈에 보기</h2><p>{moveSummary(summary)}</p>
        <p className="content-source">{moveScope} <Link to="/learn/version-data/">게임별 데이터 읽는 법</Link></p></section>}
      {summary && (
        <>
          <section className="panel">
            <span className="meta-badge move-stats-badge">기본 수치</span>
            <dl className="measurements">
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
          {data && <section className="section-stack" aria-labelledby="move-learners-heading">
            <div className="section-heading">
              <h2 id="move-learners-heading">배울 수 있는 포켓몬</h2>
              <span className="meta-badge">전체 버전</span>
            </div>
            <PokeCardList key={id} entries={learners} />
          </section>}
        </>
      )}
    </main>
  );
}
