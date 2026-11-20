import { useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const storageKey = 'poke-dict-scroll-positions';

export default function ScrollRestoration() {
  const { key, pathname, search, hash } = useLocation();
  const positionKey = `${key}:${pathname}${search}${hash}`;
  const navigationType = useNavigationType();
  const positions = useRef(null);
  if (positions.current === null) positions.current = readPositions();

  useLayoutEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => { window.history.scrollRestoration = previous; };
  }, []);

  useLayoutEffect(() => {
    if (navigationType !== 'REPLACE') {
      const position = navigationType === 'POP' ? positions.current.get(positionKey) : undefined;
      window.scrollTo(
        Number.isFinite(position?.x) ? position.x : 0,
        Number.isFinite(position?.y) ? position.y : 0,
      );
    }

    let position = { x: window.scrollX, y: window.scrollY };
    const remember = () => { position = { x: window.scrollX, y: window.scrollY }; };
    const save = () => {
      positions.current.set(positionKey, position);
      try {
        sessionStorage.setItem(storageKey, JSON.stringify([...positions.current]));
      } catch {
        // Navigation still restores from memory when browser storage is unavailable.
      }
    };
    window.addEventListener('scroll', remember, { passive: true });
    window.addEventListener('pagehide', save);
    return () => {
      save();
      window.removeEventListener('scroll', remember);
      window.removeEventListener('pagehide', save);
    };
  }, [positionKey, navigationType]);

  return null;
}

function readPositions() {
  try {
    return new Map(JSON.parse(sessionStorage.getItem(storageKey) ?? '[]'));
  } catch {
    return new Map();
  }
}
