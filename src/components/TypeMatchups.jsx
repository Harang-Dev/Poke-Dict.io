import { defenseMultiplier, typeNames } from '../dex/catalogue';

export default function TypeMatchups({ pokemon }) {
  const entry = { types: pokemon.types.map(({ type }) => type.name) };
  const groups = [4, 2, 0.5, 0.25, 0].map((multiplier) => ({
    multiplier,
    types: Object.keys(typeNames).filter((type) => defenseMultiplier(entry, type) === multiplier),
  })).filter((group) => group.types.length > 0);

  return (
    <section className="panel">
      <h2>방어 상성</h2>
      {groups.length > 0 ? (
        <dl className="matchup-groups">
          {groups.map(({ multiplier, types }) => (
            <div key={multiplier}>
              <dt>{({ 0: '무효', 0.25: '¼배', 0.5: '½배' })[multiplier] ?? `${multiplier}배`}</dt>
              <dd>{types.map((type) => <span key={type} className="type-badge" data-type={type}>{typeNames[type]}</span>)}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p>{defenseMultiplier(entry, 'normal') === null ? '타입 상성 데이터가 없어요.' : '약점과 저항이 없어요.'}</p>
      )}
    </section>
  );
}
