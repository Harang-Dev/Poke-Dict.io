import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { entryById, speciesByNumber } from './catalogue';

const storageKey = 'poke-dict-collection';
const CollectionContext = createContext(null);
export const binderLimit = 100;
export const cardLimit = 100;
const empty = { version: 1, favorites: [], caught: [], shiny: [], recent: [], team: [], binders: [] };
const idPattern = /^[1-9][0-9]{0,8}$/;
const binderIdPattern = /^[a-f0-9-]{36}$/;

function validIds(values, limit = 4000, known = (id) => entryById.has(id)) {
  if (!Array.isArray(values)) {
    return [];
  }
  return [...new Set(values.filter((id) => typeof id === 'string' && idPattern.test(id) && known(id)))].slice(0, limit);
}

export function parseCollection(text) {
  const data = JSON.parse(text);
  if (data?.version !== 1 || !['favorites', 'caught', 'shiny', 'recent', 'team', 'binders']
    .every((key) => Array.isArray(data[key]))) {
    throw new Error('Invalid collection file');
  }

  const binderIds = new Set();
  const binders = [];
  for (const binder of data.binders) {
    if (typeof binder?.id !== 'string' || !binderIdPattern.test(binder.id) || binderIds.has(binder.id)
      || typeof binder.name !== 'string' || !binder.name.trim() || !Array.isArray(binder.cards)) {
      throw new Error('Invalid binder');
    }
    binders.push({ id: binder.id, name: binder.name.trim().slice(0, 60), cards: validIds(binder.cards, cardLimit) });
    binderIds.add(binder.id);
    if (binders.length === binderLimit) {
      break;
    }
  }

  return {
    version: 1,
    favorites: validIds(data.favorites),
    caught: validIds(data.caught, 4000, (id) => speciesByNumber.has(Number(id))),
    shiny: validIds(data.shiny),
    recent: validIds(data.recent, 12),
    team: validIds(data.team, 6),
    binders,
  };
}

function readCollection() {
  const value = localStorage.getItem(storageKey);
  if (value === null) {
    return empty;
  }
  return parseCollection(value);
}

function initialCollection() {
  try {
    return readCollection();
  } catch {
    return empty;
  }
}

export function CollectionProvider({ children }) {
  const [data, setData] = useState(initialCollection);
  const [storageError, setStorageError] = useState(false);
  const unsaved = useRef(null);

  useEffect(() => {
    function refresh(event) {
      if (event.storageArea !== localStorage || (event.key !== storageKey && event.key !== null)) {
        return;
      }
      if (!unsaved.current) {
        setData(initialCollection());
      }
    }
    window.addEventListener('storage', refresh);
    return () => window.removeEventListener('storage', refresh);
  }, []);

  const update = useCallback((change) => {
    const next = change(unsaved.current ?? initialCollection());
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      unsaved.current = null;
      setStorageError(false);
    } catch {
      unsaved.current = next;
      setStorageError(true);
    }
    setData(next);
  }, []);

  const toggle = useCallback((key, id, limit = 4000) => update((latest) => {
    const values = latest[key];
    return {
      ...latest,
      [key]: values.includes(id) ? values.filter((value) => value !== id) : [...values, id].slice(0, limit),
    };
  }), [update]);

  const visit = useCallback((id) => update((latest) => (
    latest.recent[0] === id
      ? latest
      : { ...latest, recent: [id, ...latest.recent.filter((value) => value !== id)].slice(0, 12) }
  )), [update]);

  const value = useMemo(() => ({ data, update, toggle, visit }), [data, update, toggle, visit]);

  return (
    <CollectionContext.Provider value={value}>
      {storageError && <p className="storage-status" role="alert">브라우저에 저장할 수 없어요. 현재 기록은 백업으로 내보낼 수 있어요.</p>}
      {children}
    </CollectionContext.Provider>
  );
}

export function useCollection() {
  return useContext(CollectionContext);
}
