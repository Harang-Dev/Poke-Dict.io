import { Link } from 'react-router-dom';
import Breadcrumbs from './Breadcrumbs';

export function ContentLinks({ links }) {
  return (
    <ul className="guide__links">
      {links.map(([href, label]) => (
        <li key={href}>{href.startsWith('/') && !href.endsWith('.txt')
          ? <Link to={href}>{label}</Link>
          : <a href={href.startsWith('/') ? import.meta.env.BASE_URL + href.slice(1) : href}>{label}</a>}</li>
      ))}
    </ul>
  );
}

export default function ContentPage({ page, breadcrumbs, children }) {
  return (
    <main className="workspace guide">
      <Breadcrumbs items={breadcrumbs} />
      <header>
        <h1>{page.title}</h1>
        <p>{page.description}</p>
        {children}
      </header>
      {page.sections.map(({ heading, paragraphs, links }) => (
        <section key={heading}>
          <h2>{heading}</h2>
          {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          {links && <ContentLinks links={links} />}
        </section>
      ))}
      {page.links && <section><h2>직접 확인해 보기</h2><ContentLinks links={page.links} /></section>}
    </main>
  );
}
