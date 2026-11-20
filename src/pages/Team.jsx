import { Button } from '../components/ui/button';
import { useRef, useState } from 'react';
import { defenseMultiplier, entries, entryById, typeNames } from '../dex/catalogue';
import { useCollection } from '../dex/collection';
import SelectField from '../components/SelectField';
import PokemonPicker from '../components/PokemonPicker';
import PokeCardList from '../components/PokeCardList';
import EmptyState from '../components/EmptyState';

export default function Team() {
  const { data, update } = useCollection();
  const [binderId, setBinderId] = useState('');
  const searchInput = useRef(null);
  const binder = data.binders.find((item) => item.id === binderId);
  const team = data.team.map((id) => entryById.get(id)).filter(Boolean);
  const candidates = binder ? binder.cards.map((id) => entryById.get(id)).filter(Boolean) : entries;

  function add(id) {
    update((latest) => latest.team.includes(id) || latest.team.length >= 6
      ? latest
      : { ...latest, team: [...latest.team, id] });
  }

  return (
    <main className="workspace page-column">
      <header className="section-heading">
        <h1>내 팀</h1>
        <span className="meta-badge" aria-label={`팀 구성 ${team.length}/6`}>{team.length}/6</span>
      </header>
      {team.length < 6 && (
        <section className="panel section-stack" aria-label="팀에 추가">
          {data.binders.length > 0 && (
            <SelectField label="추가할 바인더" value={binderId} onChange={setBinderId}
              options={[['', '전체 도감'], ...data.binders.map((item) => [item.id, item.name])]} />
          )}
          {binder ? (
            <div className="action-row">
              {candidates.filter((entry) => !data.team.includes(entry.id)).map((entry) => (
                <Button type="button" key={entry.id} onClick={() => add(entry.id)}>{entry.name} 추가</Button>
              ))}
            </div>
          ) : <PokemonPicker inputRef={searchInput} label="팀에 추가할 포켓몬" onPick={add} excluded={data.team} />}
        </section>
      )}
      {team.length === 0 && (
        <EmptyState title="아직 팀에 포켓몬이 없어요."
          description={<>함께할 포켓몬을 골라<br />나만의 팀을 만들어 보세요.</>}>
          {binder ? (
            <Button variant="default" onClick={() => setBinderId('')}>전체 도감에서 찾기</Button>
          ) : (
            <Button variant="default" onClick={() => searchInput.current?.focus()}>포켓몬 추가하기</Button>
          )}
        </EmptyState>
      )}
      {team.length > 0 && <PokeCardList entries={team} renderActions={(entry) => (
        <Button className="tile-action" type="button" aria-label={`${entry.name} 팀에서 빼기`}
          onClick={() => update((latest) => ({ ...latest, team: latest.team.filter((id) => id !== entry.id) }))}>팀에서 빼기</Button>
      )} />}
      {team.length > 0 && (
        <section className="panel">
          <div className="section-heading">
            <h2>팀 방어 상성</h2>
            <span className="meta-badge">타입만 반영</span>
          </div>
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
