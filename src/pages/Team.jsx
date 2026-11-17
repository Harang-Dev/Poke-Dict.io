import { useState } from 'react';
import { defenseMultiplier, entries, entryById, typeNames } from '../dex/catalogue';
import { useCollection } from '../dex/collection';
import PokemonPicker from '../components/PokemonPicker';
import PokeCardList from '../components/PokeCardList';

export default function Team() {
  const { data, update } = useCollection();
  const [binderId, setBinderId] = useState('');
  const binder = data.binders.find((item) => item.id === binderId);
  const team = data.team.map((id) => entryById.get(id)).filter(Boolean);
  const candidates = binder ? binder.cards.map((id) => entryById.get(id)).filter(Boolean) : entries;

  function add(id) {
    update((latest) => latest.team.includes(id) || latest.team.length >= 6
      ? latest
      : { ...latest, team: [...latest.team, id] });
  }

  return (
    <main className="workspace">
      <h1>내 팀</h1>
      <p>포켓몬을 최대 6마리까지 골라 팀의 공통 약점을 확인하세요.</p>
      {team.length < 6 && (
        <section className="panel section-stack" aria-label="팀에 추가">
          {data.binders.length > 0 && <label>추가할 바인더
            <select value={binderId} onChange={(event) => setBinderId(event.target.value)}>
              <option value="">전체 도감</option>
              {data.binders.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>}
          {binder ? (
            <div className="action-row">
              {candidates.filter((entry) => !data.team.includes(entry.id)).map((entry) => (
                <button type="button" key={entry.id} onClick={() => add(entry.id)}>{entry.name} 추가</button>
              ))}
            </div>
          ) : <PokemonPicker label="팀에 추가할 포켓몬" onPick={add} excluded={data.team} />}
        </section>
      )}
      <h2>팀 구성 <small>{team.length}/6</small></h2>
      <PokeCardList entries={team} renderActions={(entry) => (
        <button className="tile-action" type="button" aria-label={`${entry.name} 팀에서 빼기`}
          onClick={() => update((latest) => ({ ...latest, team: latest.team.filter((id) => id !== entry.id) }))}>팀에서 빼기</button>
      )} />
      {team.length > 0 && (
        <section className="panel">
          <h2>팀 방어 상성</h2>
          <p>타입 조합 기준이에요. 특성·도구·테라스탈의 효과는 계산에 포함되지 않아요.</p>
          <div className="table-scroll" role="region" aria-label="팀 방어 상성표" tabIndex={0}>
            <table>
              <thead>
                <tr><th scope="col">공격 타입</th><th scope="col">약점</th><th scope="col">저항</th><th scope="col">무효</th></tr>
              </thead>
              <tbody>{Object.entries(typeNames).map(([type, name]) => {
                const values = team.map((entry) => defenseMultiplier(entry, type));
                return (
                  <tr key={type}>
                    <th scope="row"><span className="type-badge" data-type={type}>{name}</span></th>
                    <td>{values.filter((value) => value > 1).length}마리</td>
                    <td>{values.filter((value) => value > 0 && value < 1).length}마리</td>
                    <td>{values.filter((value) => value === 0).length}마리</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
