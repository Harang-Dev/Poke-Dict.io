import { Link, useSearchParams } from 'react-router-dom';
import { entryById, parsePokemonIds, statNames, statTotal, typeNames } from '../dex/catalogue';
import { formatPokemonNumber } from '../pokemonNumber';
import PokemonPicker from '../components/PokemonPicker';
import PokemonSprite from '../components/PokemonSprite';
import ShareLink from '../components/ShareLink';

export default function Compare() {
  const [params, setParams] = useSearchParams();
  const selected = parsePokemonIds(params.get('pokemon'), 2);
  const entries = selected.map((id) => entryById.get(id));
  const rows = [
    ['타입', (entry) => entry.types.map((type) => typeNames[type] ?? type).join(' · ')],
    ['키', (entry) => entry.height == null ? null : `${entry.height / 10} m`],
    ['몸무게', (entry) => entry.weight == null ? null : `${entry.weight / 10} kg`],
    ...statNames.map((name, index) => [name, (entry) => entry.stats[index]]),
    ['기본 스탯 합계', statTotal],
  ];

  function select(ids) {
    setParams(ids.length ? { pokemon: ids.join(',') } : {}, { replace: true });
  }

  return (
    <main className="workspace">
      <h1>포켓몬 비교</h1>
      <p>두 포켓몬의 특징과 기본 스탯을 나란히 확인하세요.</p>
      {entries.length < 2 && (
        <PokemonPicker label={entries.length ? '두 번째 포켓몬 선택' : '첫 번째 포켓몬 선택'}
          excluded={selected} onPick={(id) => select([...selected, id])} />
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
                      <Link className="comparison-pokemon" to={`/pokemon/${entry.id}`}>
                        <PokemonSprite key={entry.id} entry={entry} />
                        <span>{formatPokemonNumber(entry.number)} {entry.name}</span>
                      </Link>
                      <button type="button" onClick={() => select(selected.filter((id) => id !== entry.id))}
                        aria-label={`${entry.name} 비교에서 빼기`}>빼기</button>
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
          <ShareLink to={{ pathname: '/compare', search: new URLSearchParams({ pokemon: selected.join(',') }).toString() }}>
            비교 링크 공유
          </ShareLink>
        </>
      )}
    </main>
  );
}
