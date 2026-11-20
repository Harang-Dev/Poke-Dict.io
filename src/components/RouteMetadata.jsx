import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { pageHead, serializeStructuredData } from '../seo';

export default function RouteMetadata() {
  const { pathname } = useLocation();

  useEffect(() => {
    function update(move) {
      const { title, description, canonicalPath, url, social, structuredData } = pageHead(pathname, __POKEDICT_SITE_URL__, move);
      document.title = title;
      setHeadValue('meta[name="description"]', 'meta', { name: 'description' }, 'content', description);
      setHeadValue('meta[name="robots"]', 'meta', { name: 'robots' }, 'content', canonicalPath ? '' : 'noindex');
      setHeadValue('link[rel="canonical"]', 'link', { rel: 'canonical' }, 'href',
        canonicalPath ? url : '');
      for (const [attribute, key, value] of social) {
        setHeadValue(`meta[${attribute}="${key}"]`, 'meta', { [attribute]: key }, 'content', value);
      }
      const existing = document.getElementById('page-structured-data');
      if (structuredData) {
        const script = existing ?? document.createElement('script');
        script.id = 'page-structured-data';
        script.type = 'application/ld+json';
        script.textContent = serializeStructuredData(structuredData);
        if (!existing) document.head.append(script);
      } else {
        existing?.remove();
      }
    }

    update();
    const moveId = pathname.match(/^\/moves\/(\d+)\/?$/)?.[1];
    if (!moveId) return;

    let current = true;
    import('../dex/gameData').then(({ moveById }) => {
      if (current) update(moveById.get(moveId));
    }).catch(() => {
      if (current) update();
    });
    return () => { current = false; };
  }, [pathname]);

  return null;
}

function setHeadValue(selector, tag, attributes, attribute, value) {
  const existing = document.head.querySelector(selector);
  if (!value) {
    existing?.remove();
    return;
  }
  const element = existing ?? document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  element.setAttribute(attribute, value);
  if (!existing) document.head.append(element);
}
