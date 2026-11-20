import { pokemonPath } from '../paths';
import { Button } from '../components/ui/button';
import { useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { entryById, parsePokemonIds, statNames, statTotal, typeNames } from '../dex/catalogue';
import { formatPokemonNumber } from '../pokemonNumber';
import PokemonPicker from '../components/PokemonPicker';
import PokemonSprite from '../components/PokemonSprite';
import ShareLink from '../components/ShareLink';
import EmptyState from '../components/EmptyState';

export default function Compare() {
  const [params, setParams] = useSearchParams();
  const selected = parsePokemonIds(params.get('pokemon'), 2);
  const entries = selected.map((id) => entryById.get(id));
  const searchInput = useRef(null);
  const rows = [
    ['타입', (entry) => entry.types.length ? (
      <div className="type-list">
        {entry.types.map((type) => <span key={type} className="type-badge" data-type={type}>{typeNames[type] ?? type}</span>)}
      </div>
    ) : null],
    ['키', (entry) => entry.height == null ? null : `${entry.height / 10} m`],
    ['몸무게', (entry) => entry.weight == null ? null : `${entry.weight / 10} kg`],
    ...statNames.map((name, index) => [name, (entry) => entry.stats[index]]),
    ['기본 스탯 합계', statTotal],
  ];

  function select(ids) {
    setParams(ids.length ? { pokemon: ids.join(',') } : {}, { replace: true });
  }

  return (
    <main className="workspace page-column">
      <h1>포켓몬 비교</h1>
      {entries.length < 2 && (
        <section className="panel" aria-label="비교 대상">
          <PokemonPicker label={entries.length ? '두 번째 포켓몬 선택' : '첫 번째 포켓몬 선택'}
            inputRef={searchInput} excluded={selected} onPick={(id) => select([...selected, id])} />
        </section>
      )}
      {entries.length === 0 && (
        <EmptyState title="아직 비교할 포켓몬이 없어요."
          description={<>포켓몬 두 마리를 선택해<br />타입과 능력치를 비교해 보세요.</>}>
          <Button variant="default" onClick={() => searchInput.current?.focus()}>포켓몬 선택하기</Button>
        </EmptyState>
      )}
      {entries.length > 0 && (
        <>
          <div className="table-scroll" tabIndex={0} role="region" aria-label="포켓몬 비교표">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th scope="col">비교 항목</th>
                  {entries.map((entry) => (
                    <th key={entry.id} scope="col">
                      <Link className="comparison-pokemon" to={pokemonPath(entry.id)}>
                        <PokemonSprite key={entry.id} entry={entry} />
                        <span className="meta-badge">{formatPokemonNumber(entry.number)}</span>
                        <span>{entry.name}</span>
                      </Link>
                      <Button variant="ghost" type="button" onClick={() => select(selected.filter((id) => id !== entry.id))}
                        aria-label={`${entry.name} 비교에서 빼기`}>빼기</Button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>{rows.map(([label, value]) => (
                <tr key={label}><th scope="row">{label}</th>
                  {entries.map((entry) => <td key={entry.id}>{value(entry) ?? '—'}</td>)}
                </tr>
              ))}</tbody>
            </table>
          </div>
          <ShareLink to={{ pathname: '/compare/', search: new URLSearchParams({ pokemon: selected.join(',') }).toString() }}>
            비교 링크 공유
          </ShareLink>
        </>
      )}
    </main>
  );
}
