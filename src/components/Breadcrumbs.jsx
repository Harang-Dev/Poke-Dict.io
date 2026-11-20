import { Link } from 'react-router-dom';

export default function Breadcrumbs({ items }) {
  if (!items || items.length < 2) return null;
  return (
    <nav className="breadcrumbs" aria-label="현재 위치">
      <ol>{items.map(({ name, path }, index) => (
        <li key={path}>{index === items.length - 1
          ? <span aria-current="page">{name}</span>
          : <Link to={path}>{name}</Link>}</li>
      ))}</ol>
    </nav>
  );
}
