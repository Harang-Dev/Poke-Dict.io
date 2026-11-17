import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import regionalDexes from '../data/regional.json';
import { defaultEntries, entryById, parsePokemonIds, speciesByNumber } from '../dex/catalogue';
import { binderLimit, cardLimit, parseCollection, useCollection } from '../dex/collection';
import PokeCardList from '../components/PokeCardList';
import PokemonPicker from '../components/PokemonPicker';
import ShareLink from '../components/ShareLink';

const dexes = [{ id: 'national', name: '전국도감', numbers: defaultEntries.map((entry) => entry.number) }, ...regionalDexes];

export default function Collection() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') ?? 'favorites';
  const { data, toggle } = useCollection();
  const favorites = data.favorites.map((id) => entryById.get(id)).filter(Boolean);

  return (
    <main className="workspace">
      <h1>내 컬렉션</h1>
      <nav className="section-nav" aria-label="컬렉션">
        {[['favorites', '즐겨찾기'], ['checklist', '도감 체크'], ['binders', '바인더'], ['backup', '백업']].map(([id, name]) => (
          <Link key={id} aria-current={tab === id ? 'page' : undefined} to={`/collection?tab=${id}`}>{name}</Link>
        ))}
      </nav>
      {tab === 'checklist' ? <Checklist /> : tab === 'binders' ? (
        <Binders selectedId={params.get('binder')} onSelect={(binder) => setParams({ tab: 'binders', ...(binder && { binder }) })} />
      ) : tab === 'backup' ? <Backup /> : (
        <section>
          <h2>즐겨찾기</h2>
          {favorites.length === 0 ? <p>상세 화면에서 즐겨찾기에 추가한 카드를 모아 볼 수 있어요.</p> : (
            <PokeCardList entries={favorites} renderActions={(entry) => (
              <button className="tile-action" type="button" onClick={() => toggle('favorites', entry.id)}
                aria-label={`${entry.name} 즐겨찾기 해제`}>즐겨찾기 해제</button>
            )} />
          )}
        </section>
      )}
    </main>
  );
}

function Checklist() {
  const [dexId, setDexId] = useState('national');
  const [missingOnly, setMissingOnly] = useState(false);
  const [shinyMode, setShinyMode] = useState(false);
  const { data, toggle } = useCollection();
  const dex = dexes.find(({ id }) => id === dexId);
  const active = new Set(shinyMode ? data.shiny : data.caught);
  const catalogue = dex.numbers.map((number) => speciesByNumber.get(number)).filter(Boolean);
  const keyFor = (entry) => shinyMode ? entry.id : String(entry.number);
  const count = catalogue.filter((entry) => active.has(keyFor(entry))).length;
  const visible = missingOnly ? catalogue.filter((entry) => !active.has(keyFor(entry))) : catalogue;

  return (
    <section>
      <h2>도감 체크</h2>
      <div className="filter-row">
        <label>도감
          <select value={dexId} onChange={(event) => setDexId(event.target.value)}>
            {dexes.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
          </select>
        </label>
        <label className="checkbox-row"><input type="checkbox" checked={missingOnly}
          onChange={(event) => setMissingOnly(event.target.checked)} /> 미등록만 보기</label>
        <label className="checkbox-row"><input type="checkbox" checked={shinyMode}
          onChange={(event) => setShinyMode(event.target.checked)} /> 색이 다른 모습 도감</label>
      </div>
      <p role="status">{count} / {catalogue.length} 등록 · {catalogue.length ? Math.round(count / catalogue.length * 100) : 0}%</p>
      <progress aria-label="도감 완성률" value={count} max={catalogue.length || 1} />
      {shinyMode && <p>기본 모습 기준이에요. 개별 폼의 기록은 각 상세 화면에서 확인할 수 있어요.</p>}
      <PokeCardList key={`${dexId}:${shinyMode}:${missingOnly}`} entries={visible} renderActions={(entry) => (
        <button className="tile-action" type="button" aria-pressed={active.has(keyFor(entry))}
          aria-label={`${entry.name} ${shinyMode ? '색이 다른 모습' : '잡은 포켓몬'} 체크`}
          onClick={() => toggle(shinyMode ? 'shiny' : 'caught', keyFor(entry))}>
          {active.has(keyFor(entry)) ? '등록 완료' : '등록하기'}
        </button>
      )} />
    </section>
  );
}

function Binders({ selectedId, onSelect }) {
  const [name, setName] = useState('');
  const { data, update } = useCollection();
  const selected = data.binders.find(({ id }) => id === selectedId) ?? data.binders[0];

  function create(event) {
    event.preventDefault();
    const title = name.trim();
    if (!title || data.binders.length >= binderLimit) {
      return;
    }
    const id = crypto.randomUUID();
    update((current) => ({ ...current, binders: [...current.binders, { id, name: title, cards: [] }].slice(0, binderLimit) }));
    setName('');
    onSelect(id);
  }

  return (
    <section>
      <h2>카드 바인더</h2>
      <form className="inline-form" onSubmit={create}>
        <label>새 바인더 이름<input value={name} maxLength={60} onChange={(event) => setName(event.target.value)} /></label>
        <button type="submit" disabled={!name.trim() || data.binders.length >= binderLimit}>바인더 만들기</button>
      </form>
      {selected && (
        <>
          <label>바인더 선택
            <select value={selected.id} onChange={(event) => onSelect(event.target.value)}>
              {data.binders.map((binder) => <option key={binder.id} value={binder.id}>{binder.name}</option>)}
            </select>
          </label>
          <BinderEditor key={selected.id} binder={selected} onDelete={() => {
            update((current) => ({ ...current, binders: current.binders.filter((binder) => binder.id !== selected.id) }));
            onSelect(null);
          }} />
        </>
      )}
    </section>
  );
}

function BinderEditor({ binder, onDelete }) {
  const { data, update } = useCollection();
  const [name, setName] = useState(binder.name);
  const entries = binder.cards.map((id) => entryById.get(id)).filter(Boolean);
  const shareParams = new URLSearchParams({ title: binder.name, cards: entries.map(({ id }) => id).join(',') });

  function edit(change) {
    update((current) => ({
      ...current,
      binders: current.binders.map((item) => item.id === binder.id ? change(item) : item),
    }));
  }

  function add(id) {
    edit((item) => ({
      ...item,
      cards: item.cards.includes(id) ? item.cards : [...item.cards, id].slice(0, cardLimit),
    }));
  }

  function move(id, offset) {
    edit((item) => {
      const cards = [...item.cards];
      const index = cards.indexOf(id);
      const swap = index + offset;
      if (index < 0 || swap < 0 || swap >= cards.length) {
        return item;
      }
      [cards[index], cards[swap]] = [cards[swap], cards[index]];
      return { ...item, cards };
    });
  }

  const favoriteCandidates = data.favorites.filter((id) => !binder.cards.includes(id)).map((id) => entryById.get(id)).filter(Boolean);

  return (
    <div className="panel section-stack">
      <h3>{binder.name}</h3>
      <form className="inline-form" onSubmit={(event) => {
        event.preventDefault();
        if (name.trim()) {
          edit((item) => ({ ...item, name: name.trim() }));
        }
      }}>
        <label>바인더 이름<input value={name} maxLength={60} onChange={(event) => setName(event.target.value)} /></label>
        <button type="submit" disabled={!name.trim() || name.trim() === binder.name}>이름 저장</button>
      </form>
      {binder.cards.length < cardLimit && (
        <>
          {favoriteCandidates.length > 0 && <label>즐겨찾기에서 추가
            <select value="" onChange={(event) => add(event.target.value)}>
              <option value="" disabled>포켓몬 선택</option>
              {favoriteCandidates.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
            </select>
          </label>}
          <PokemonPicker label="도감에서 카드 추가" onPick={add} excluded={binder.cards} />
        </>
      )}
      <PokeCardList key={binder.id} entries={entries} renderActions={(entry) => {
        const index = binder.cards.indexOf(entry.id);
        return (
          <div className="tile-controls">
            <button type="button" onClick={() => move(entry.id, -1)} disabled={index === 0}
              aria-label={`${entry.name} 앞으로 이동`}>←</button>
            <button type="button" onClick={() => move(entry.id, 1)} disabled={index === binder.cards.length - 1}
              aria-label={`${entry.name} 뒤로 이동`}>→</button>
            <button type="button" onClick={() => edit((item) => ({ ...item, cards: item.cards.filter((id) => id !== entry.id) }))}
              aria-label={`${entry.name} 바인더에서 빼기`}>빼기</button>
          </div>
        );
      }} />
      <div className="action-row">
        <ShareLink to={{ pathname: '/binder', search: shareParams.toString() }}>바인더 공유</ShareLink>
        <button type="button" onClick={onDelete}>바인더 삭제</button>
      </div>
    </div>
  );
}

export function SharedBinder() {
  const [params] = useSearchParams();
  const title = params.get('title')?.trim().slice(0, 60) || '공유 바인더';
  const entries = parsePokemonIds(params.get('cards'), cardLimit).map((id) => entryById.get(id));
  return <main className="workspace"><h1>{title}</h1><PokeCardList entries={entries} /></main>;
}

function Backup() {
  const { data, update } = useCollection();
  const [status, setStatus] = useState(null);

  function download() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'poke-dict-backup.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function restore(event) {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) {
      return;
    }
    try {
      if (file.size > 2_000_000) {
        throw new Error('Backup too large');
      }
      const backup = parseCollection(await file.text());
      update((current) => mergeCollection(current, backup));
      setStatus({ error: false, message: '백업을 현재 기록에 합쳤어요.' });
    } catch {
      setStatus({ error: true, message: '올바른 Poke-Dict 백업 파일을 선택해 주세요.' });
    }
  }

  return (
    <section className="section-stack">
      <h2>컬렉션 백업</h2>
      <p>이 브라우저에 저장한 기록을 파일로 옮기거나, 백업 파일을 현재 기록과 합칠 수 있어요.</p>
      <div className="action-row">
        <button type="button" onClick={download}>백업 내보내기</button>
        <label>백업 가져오기<input type="file" accept=".json,application/json" onChange={restore} /></label>
      </div>
      {status && <p role={status.error ? 'alert' : 'status'}>{status.message}</p>}
    </section>
  );
}

function mergeCollection(current, backup) {
  const binders = new Map(current.binders.map((binder) => [binder.id, binder]));
  for (const binder of backup.binders) {
    const existing = binders.get(binder.id);
    if (existing) {
      binders.set(binder.id, { ...existing, cards: [...new Set([...existing.cards, ...binder.cards])].slice(0, cardLimit) });
    } else if (binders.size < binderLimit) {
      binders.set(binder.id, binder);
    }
  }
  const merged = { ...current, binders: [...binders.values()] };
  for (const key of ['favorites', 'caught', 'shiny', 'recent']) {
    merged[key] = [...new Set([...current[key], ...backup[key]])].slice(0, key === 'recent' ? 12 : 4000);
  }
  merged.team = current.team.length ? current.team : backup.team;
  return merged;
}
