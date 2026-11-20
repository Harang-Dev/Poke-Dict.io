import { Link } from 'react-router-dom';
import { pokemonInsights, matchupScope } from '../dex/insights';
import { catalogueSource } from '../content/learning';
import { typeNames } from '../dex/catalogue';

export default function PokemonOverview({ entry }) {
  const { intro, weaknessText, statText } = pokemonInsights(entry);
  return (
    <section className="panel pokemon-overview" aria-label="핵심 정보">
      <h2>{entry.name} 한눈에 보기</h2>
      <p>{intro}</p>
      <p>{statText}</p>
      <h3>{entry.name}의 약점은?</h3>
      <p>{weaknessText}</p>
      <p className="content-source">{matchupScope}</p>
      <nav className="section-nav" aria-label="정보 더 보기">
        {entry.types.map((type) => <Link key={type} to={`/types/${type}/`}>{typeNames[type]} 타입 도감</Link>)}
        <Link to={`/generations/${entry.generation}/`}>{entry.generation}세대 도감</Link>
        <Link to="/learn/type-matchups/">상성 읽는 법</Link>
      </nav>
      <p className="content-source">기본 정보·계산 출처: <a href={catalogueSource}>PokéAPI 데이터 리비전</a></p>
    </section>
  );
}
