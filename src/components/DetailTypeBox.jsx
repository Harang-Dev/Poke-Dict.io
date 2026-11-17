import { useQuery } from '@tanstack/react-query';
import {
  abilityOptions,
  koreanAbilityDescription,
  koreanName,
  typeOptions,
} from '../api/pokeApi';
import RequestError from './RequestError';

const statLabels = {
  hp: '체력',
  attack: '공격',
  defense: '방어',
  'special-attack': '특수공격',
  'special-defense': '특수방어',
  speed: '스피드',
};

export default function DetailTypeBox({ pokemon }) {
  return (
    <div className="detail-info">
      <section className="panel" aria-labelledby="type-title">
        <h2 id="type-title">타입</h2>
        <ul className="type-list">
          {pokemon.types.map(({ type }) => <TypeBadge key={type.name} type={type} />)}
        </ul>
      </section>
      <section className="panel" aria-labelledby="ability-title">
        <h2 id="ability-title">특성</h2>
        <ul className="ability-list">
          {pokemon.abilities.map(({ ability }) => <Ability key={ability.name} ability={ability} />)}
        </ul>
      </section>
      <section className="panel" aria-labelledby="stat-title">
        <h2 id="stat-title">기본 스탯</h2>
        <dl className="stat-list">
          {pokemon.stats.map(({ stat, base_stat }) => (
            <div key={stat.name}>
              <dt>{statLabels[stat.name] ?? stat.name}</dt>
              <dd>{base_stat}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}

function TypeBadge({ type }) {
  const query = useQuery(typeOptions(type));
  const name = koreanName(query.data) ?? type.name;

  return (
    <li>
      <span className="type-badge" data-type={type.name}>{name}</span>
      {query.isError && (
        <RequestError
          message={`${name} 타입 정보를 불러오지 못했어요.`}
          retry={() => query.refetch()}
          retrying={query.isFetching}
        />
      )}
    </li>
  );
}

function Ability({ ability }) {
  const query = useQuery(abilityOptions(ability));
  const name = koreanName(query.data) ?? ability.name;

  return (
    <li>
      <details>
        <summary>{name}</summary>
        {query.isError ? (
          <RequestError
            message="특성 설명을 불러오지 못했어요."
            retry={() => query.refetch()}
            retrying={query.isFetching}
          />
        ) : query.isPending ? (
          <p role="status">특성 설명을 불러오는 중…</p>
        ) : (
          <p>{koreanAbilityDescription(query.data) || '한국어 설명이 없어요.'}</p>
        )}
      </details>
    </li>
  );
}
