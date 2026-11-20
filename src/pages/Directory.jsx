import { Link, useParams } from 'react-router-dom';
import { directoryPage, directoryPath } from '../content/directories';
import { pokemonPath } from '../paths';
import { formatPokemonNumber } from '../pokemonNumber';
import Breadcrumbs from '../components/Breadcrumbs';
import { pageMetadata } from '../seo';

export default function Directory({ kind }) {
  const { value } = useParams();
  const page = directoryPage(kind, value);
  if (!page) return <main className="workspace"><h1>도감 분류를 찾을 수 없어요.</h1><Link to={directoryPath(kind)}>분류 목록으로</Link></main>;
  return (
    <main className="workspace guide">
      <Breadcrumbs items={pageMetadata(directoryPath(kind, value)).breadcrumbs} />
      <h1>{page.title}</h1>
      <p>{page.description}</p>
      {page.note && <p className="content-source">{page.note}</p>}
      {page.entries ? (
        <ul className="directory-list" aria-label="분류된 포켓몬">{page.entries.map((entry) => (
          <li key={entry.id}><Link to={pokemonPath(entry.id)}><span>{formatPokemonNumber(entry.number)}</span> {entry.name}</Link></li>
        ))}</ul>
      ) : (
        <ul className="directory-list" aria-label="도감 분류">{page.options.map(([id, label]) => (
          <li key={id}><Link to={directoryPath(kind, id)}>{label}{kind === 'types' ? ' 타입' : ''}</Link></li>
        ))}</ul>
      )}
      <nav className="section-nav" aria-label="함께 읽기"><Link to="/learn/">도감 활용 가이드</Link><Link to="/">전체 도감 검색</Link></nav>
    </main>
  );
}
