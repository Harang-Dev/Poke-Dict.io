import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { encounterOptions, evolutionOptions } from '../api/pokeApi';
import { speciesByNumber, typeNames } from '../dex/catalogue';
import { encounterConditionLabel, encounterMethodLabel, learnMethods, locationLabel, moveBySlug, readableName } from '../dex/gameData';
import { versions } from '../dex/versions';
import KantoMap from './KantoMap';
import RequestError from './RequestError';

export default function VersionDex({ id, pokemon, species }) {
  const [versionId, setVersionId] = useState(() => defaultVersion(pokemon));
  const [view, setView] = useState('moves');
  const version = versions.find(({ id }) => id === versionId);

  return (
    <div className="section-stack">
      <label>게임 버전
        <select value={versionId} onChange={(event) => setVersionId(event.target.value)}>
          {versions.map(({ id, name }) => <option value={id} key={id}>{name}</option>)}
        </select>
      </label>
      <div className="action-row">
        <button type="button" aria-pressed={view === 'moves'} onClick={() => setView('moves')}>배우는 기술</button>
        <button type="button" aria-pressed={view === 'locations'} onClick={() => setView('locations')}>출현·획득 방법</button>
      </div>
      {view === 'moves' ? <VersionMoves key={versionId} pokemon={pokemon} version={version} /> : (
        <Locations key={versionId} id={id} version={version} pokemon={pokemon} species={species} />
      )}
    </div>
  );
}

function defaultVersion(pokemon) {
  const groups = new Set((pokemon.moves ?? []).flatMap((move) => move.version_group_details.map((entry) => entry.version_group.name)));
  return versions.find(({ id, group }) => id === 'scarlet' && groups.has(group))?.id
    ?? [...versions].reverse().find(({ group }) => groups.has(group))?.id
    ?? versions[0].id;
}

function VersionMoves({ pokemon, version }) {
  const [filter, setFilter] = useState('');
  const groups = new Map();
  for (const { move, version_group_details: details } of pokemon.moves ?? []) {
    for (const detail of details) {
      if (detail.version_group.name === version.group) {
        const name = detail.move_learn_method.name;
        const group = groups.get(name) ?? [];
        group.push({ move, level: detail.level_learned_at });
        groups.set(name, group);
      }
    }
  }
  if (!groups.size) {
    return <p role="status">이 버전의 기술 습득 데이터가 없어요.</p>;
  }
  return (
    <>
      <label>습득 방법
        <select value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="">전체</option>
          {[...groups.keys()].map((name) => <option key={name} value={name}>{learnMethods[name] ?? readableName(name)}</option>)}
        </select>
      </label>
      {[...groups].filter(([method]) => !filter || filter === method).map(([method, records]) => (
        <div key={method}>
          <h3>{learnMethods[method] ?? readableName(method)}</h3>
          <ul className="move-chips">
            {records.sort((a, b) => a.level - b.level).map(({ move, level }, index) => {
              const item = moveBySlug.get(move.name);
              return (
                <li key={`${move.name}:${level}:${index}`}>
                  {method === 'level-up' && <small>{level > 0 ? `Lv. ${level}` : '레벨 정보 없음'}</small>}
                  {item ? <Link to={`/moves/${item.id}`}>{item.name}</Link> : readableName(move.name)}
                  {item && <span className="type-badge" data-type={item.type}>{typeNames[item.type] ?? item.type}</span>}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </>
  );
}

function Locations({ id, version, pokemon, species }) {
  const encounters = useQuery(encounterOptions(id));
  const chain = useQuery(evolutionOptions(species));
  const records = (encounters.data ?? []).flatMap(({ location_area: area, version_details: details }) => (
    details.filter((detail) => detail.version.name === version.id).map((detail) => ({
      ...locationLabel(area),
      id: area.name,
      details: detail.encounter_details,
    }))
  ));

  return (
    <>
      <h3>출현 장소</h3>
      {encounters.isPending ? <p role="status">출현 정보를 불러오는 중…</p> : encounters.isError ? (
        <RequestError message="출현 정보를 불러오지 못했어요." retry={() => encounters.refetch()} retrying={encounters.isFetching} />
      ) : records.length ? (
        <>
          {(version.id === 'red' || version.id === 'blue') && <KantoMap records={records} />}
          <ul className="encounter-list">{records.map((record) => (
            <li key={record.id}>
              <strong>{record.name}</strong>
              <ul>{record.details.map((detail, index) => (
                <li key={index}>
                  {encounterMethodLabel(detail.method.name)}
                  {detail.min_level != null && detail.max_level != null && (
                    detail.min_level === detail.max_level ? ` · Lv. ${detail.min_level}` : ` · Lv. ${detail.min_level}–${detail.max_level}`
                  )}
                  {detail.condition_values?.length > 0 && (
                    ` · ${detail.condition_values.map(({ name }) => encounterConditionLabel(name)).join(', ')}`
                  )}
                </li>
              ))}</ul>
            </li>
          ))}</ul>
        </>
      ) : <p>이 버전의 야생 출현 기록이 없어요.</p>}
      <EvolutionAcquisition pokemon={pokemon} species={species} chain={chain.data?.chain} version={version} />
    </>
  );
}

function EvolutionAcquisition({ pokemon, species, chain, version }) {
  if (!species?.evolves_from_species || !chain) {
    return null;
  }
  const node = findEvolution(chain, species.name);
  const forms = new Set(pokemon.forms?.map(({ name }) => name));
  const details = node?.evolution_details.filter((detail) => detail.version_group?.name === version.group && (
    detail.evolved_pokemon_form ? forms.has(detail.evolved_pokemon_form.name) : pokemon.is_default
  )) ?? [];
  const previous = speciesByNumber.get(Number(species.evolves_from_species.url?.match(/\/(\d+)\/?$/)?.[1]));
  if (!details.length || !previous) {
    return null;
  }

  return (
    <section>
      <h3>진화로 획득</h3>
      <p><Link to={`/pokemon/${previous.id}`}>{previous.name}</Link>에서 진화해요.</p>
      <ul>{details.map((detail, index) => <li key={index}>{evolutionConditions(detail).join(' · ')}</li>)}</ul>
    </section>
  );
}

function evolutionConditions(detail) {
  const triggerNames = { 'level-up': '레벨업', 'use-item': '도구 사용', trade: '교환' };
  const conditions = [triggerNames[detail.trigger.name] ?? readableName(detail.trigger.name)];
  const resources = {
    item: '사용 도구', held_item: '지닌 도구', location: '장소', region: '지방',
    known_move: '배운 기술', known_move_type: '배운 기술 타입', party_species: '같은 팀 포켓몬',
    party_type: '같은 팀 타입', trade_species: '교환 상대', required_pokemon_form: '진화 전 폼',
    used_move: '사용 기술',
  };
  const minimums = {
    min_level: '레벨', min_happiness: '친밀도', min_beauty: '아름다움', min_affection: '친애도',
    min_steps: '걸음 수', min_move_count: '기술 사용 횟수', min_damage_taken: '받은 피해',
  };
  const flags = {
    near_special_rock: '특수한 바위 근처', needs_overworld_rain: '필드에서 비가 올 때',
    needs_multiplayer: '멀티플레이 중', turn_upside_down: '기기를 뒤집은 상태',
  };
  for (const [key, label] of Object.entries(resources)) {
    if (detail[key]?.name) conditions.push(`${label} ${readableName(detail[key].name)}`);
  }
  for (const [key, label] of Object.entries(minimums)) {
    if (detail[key] != null) conditions.push(`${label} ${detail[key]} 이상`);
  }
  for (const [key, label] of Object.entries(flags)) {
    if (detail[key]) conditions.push(label);
  }
  if (detail.time_of_day) conditions.push(({ day: '낮', night: '밤', dusk: '황혼' })[detail.time_of_day] ?? readableName(detail.time_of_day));
  if (detail.gender != null) conditions.push(({ 1: '암컷', 2: '수컷' })[detail.gender] ?? '성별 조건 있음');
  if (detail.relative_physical_stats != null) {
    conditions.push(({ '-1': '공격 < 방어', 0: '공격 = 방어', 1: '공격 > 방어' })[detail.relative_physical_stats]);
  }
  if (detail.allowed_natures?.length) {
    conditions.push(`성격 ${detail.allowed_natures.map(({ name }) => readableName(name)).join(', ')}`);
  }
  if (detail.condition_expression) conditions.push('복합 조건 있음');
  return conditions.filter(Boolean);
}

function findEvolution(node, name) {
  if (node.species.name === name) {
    return node;
  }
  for (const child of node.evolves_to) {
    const found = findEvolution(child, name);
    if (found) {
      return found;
    }
  }
  return undefined;
}
