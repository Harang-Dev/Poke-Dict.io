import { Link } from 'react-router-dom';
import { dataSources } from '../seo';
import { footerDescription, footerLinks, footerRightsNotice, footerStorageNotice } from '../siteInfo';

export default function SiteFooter() {
  return (
    <footer className="site-footer" aria-label="사이트 정보">
      <div className="site-footer__inner">
        <div className="site-footer__main">
          <div>
            <strong className="site-footer__brand">Poke-Dict</strong>
            <p>{footerDescription}</p>
            <p className="site-footer__storage">{footerStorageNotice}</p>
          </div>
          <nav className="site-footer__links" aria-label="서비스 안내">
            {footerLinks.map(([to, label]) => <Link key={to} to={to}>{label}</Link>)}
          </nav>
        </div>
        <div className="site-footer__bottom">
          <nav className="site-footer__links" aria-label="데이터 출처">
            {dataSources.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
          </nav>
          <p>{footerRightsNotice}</p>
        </div>
      </div>
    </footer>
  );
}
