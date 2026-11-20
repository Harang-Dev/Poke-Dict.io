import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useId, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import regionalDexes from '../data/regional.json';
import { defaultEntries, entryById, parsePokemonIds, speciesByNumber } from '../dex/catalogue';
import { binderLimit, cardLimit, parseCollection, useCollection } from '../dex/collection';
import PokeCardList from '../components/PokeCardList';
import PokemonPicker from '../components/PokemonPicker';
import { Checkbox } from '../components/ui/checkbox';
import { Progress } from '../components/ui/progress';
import SelectField from '../components/SelectField';
import ShareLink from '../components/ShareLink';
import EmptyState from '../components/EmptyState';

const dexes = [{ id: 'national', name: '전국도감', numbers: defaultEntries.map((entry) => entry.number) }, ...regionalDexes];

export default function Collection() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') ?? 'favorites';
  const { data, toggle } = useCollection();
  const favorites = data.favorites.map((id) => entryById.get(id)).filter(Boolean);

  return (
    <main className="workspace page-column">
      <h1>내 컬렉션</h1>
      <nav className="section-nav collection-nav" aria-label="컬렉션">
        {[['favorites', '즐겨찾기'], ['checklist', '도감 체크'], ['binders', '바인더'], ['backup', '백업']].map(([id, name]) => (
          <Link key={id} aria-current={tab === id ? 'page' : undefined} to={`/collection/?tab=${id}`}>{name}</Link>
        ))}
      </nav>
      {tab === 'checklist' ? <Checklist /> : tab === 'binders' ? (
        <Binders selectedId={params.get('binder')} onSelect={(binder) => setParams({ tab: 'binders', ...(binder && { binder }) })} />
      ) : tab === 'backup' ? <Backup /> : (
        <section aria-label="즐겨찾기" className={favorites.length === 0 ? 'page-column' : undefined}>
          {favorites.length === 0 ? (
            <EmptyState title="즐겨찾기가 비어 있습니다."
              description={<>도감에서 마음에 드는 포켓몬을 찾아<br />즐겨찾기에 추가해 보세요.</>}>
              <Button asChild variant="default" className="no-underline">
                <Link to="/">도감 둘러보기</Link>
              </Button>
            </EmptyState>
          ) : (
            <PokeCardList entries={favorites} renderActions={(entry) => (
              <Button className="tile-action" type="button" onClick={() => toggle('favorites', entry.id)}
                aria-label={`${entry.name} 즐겨찾기 해제`}>즐겨찾기 해제</Button>
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
    <section className="section-stack page-column" aria-label="도감 체크">
      <div className="filter-row">
        <SelectField label="도감" value={dexId} onChange={setDexId}
          options={dexes.map(({ id, name }) => [id, name])} />
        <ChecklistOption checked={missingOnly} onChange={setMissingOnly}>미등록만 보기</ChecklistOption>
        <ChecklistOption checked={shinyMode} onChange={setShinyMode}>색이 다른 모습 도감</ChecklistOption>
      </div>
      <div className="checklist-progress">
        <div className="section-heading">
          <span className="meta-badge" role="status">{count} / {catalogue.length} 등록 · {catalogue.length ? Math.round(count / catalogue.length * 100) : 0}%</span>
          {shinyMode && <span className="meta-badge">기본 폼 기준</span>}
        </div>
        <Progress aria-label="도감 완성률" value={count} max={catalogue.length || 1} />
      </div>
      {visible.length === 0 ? (
        <EmptyState title="이 도감의 포켓몬을 모두 등록했어요."
          description={<>미등록만 보기 조건을 해제하고<br />모은 포켓몬을 확인해 보세요.</>}>
          <Button variant="default" onClick={() => setMissingOnly(false)}>전체 목록 보기</Button>
        </EmptyState>
      ) : <PokeCardList key={`${dexId}:${shinyMode}:${missingOnly}`} entries={visible} renderActions={(entry) => (
        <Button className="tile-action" type="button" aria-pressed={active.has(keyFor(entry))}
          aria-label={`${entry.name} ${shinyMode ? '색이 다른 모습' : '잡은 포켓몬'} 체크`}
          onClick={() => toggle(shinyMode ? 'shiny' : 'caught', keyFor(entry))}>
          {active.has(keyFor(entry)) ? '등록 완료' : '등록하기'}
        </Button>
      )} />}
    </section>
  );
}

function ChecklistOption({ checked, onChange, children }) {
  const id = useId();
  return (
    <div className="checkbox-row">
      <Checkbox id={id} checked={checked} onCheckedChange={onChange} />
      <label htmlFor={id}>{children}</label>
    </div>
  );
}

function Binders({ selectedId, onSelect }) {
  const [name, setName] = useState('');
  const nameInput = useRef(null);
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
    <section className="section-stack page-column" aria-label="카드 바인더">
      <form className="inline-form" onSubmit={create}>
        <label>새 바인더 이름<Input ref={nameInput} value={name} maxLength={60} onChange={(event) => setName(event.target.value)} /></label>
        <Button type="submit" disabled={!name.trim() || data.binders.length >= binderLimit}>바인더 만들기</Button>
      </form>
      {!selected && (
        <EmptyState title="아직 바인더가 없어요."
          description={<>바인더에 이름을 붙이고<br />좋아하는 포켓몬을 모아 보세요.</>}>
          <Button variant="default" onClick={() => nameInput.current?.focus()}>바인더 이름 입력하기</Button>
        </EmptyState>
      )}
      {selected && (
        <>
          <SelectField label="바인더 선택" value={selected.id} onChange={onSelect}
            options={data.binders.map((binder) => [binder.id, binder.name])} />
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
  const searchInput = useRef(null);
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
    <section className="panel section-stack page-column" aria-label={binder.name}>
      <form className="inline-form" onSubmit={(event) => {
        event.preventDefault();
        if (name.trim()) {
          edit((item) => ({ ...item, name: name.trim() }));
        }
      }}>
        <label>바인더 이름<Input value={name} maxLength={60} onChange={(event) => setName(event.target.value)} /></label>
        <Button type="submit" disabled={!name.trim() || name.trim() === binder.name}>이름 저장</Button>
      </form>
      {binder.cards.length < cardLimit && (
        <>
          {favoriteCandidates.length > 0 && (
            <SelectField label="즐겨찾기에서 추가" value="" onChange={add} placeholder="포켓몬 선택"
              options={favoriteCandidates.map((entry) => [entry.id, entry.name])} />
          )}
          <PokemonPicker inputRef={searchInput} label="도감에서 카드 추가" onPick={add} excluded={binder.cards} />
        </>
      )}
      {entries.length === 0 ? (
        <EmptyState title="아직 바인더에 포켓몬이 없어요."
          description={<>좋아하는 포켓몬을 찾아<br />첫 번째 카드를 추가해 보세요.</>}>
          <Button variant="default" onClick={() => searchInput.current?.focus()}>포켓몬 추가하기</Button>
        </EmptyState>
      ) : <PokeCardList key={binder.id} entries={entries} renderActions={(entry) => {
        const index = binder.cards.indexOf(entry.id);
        return (
          <div className="tile-controls">
            <Button type="button" onClick={() => move(entry.id, -1)} disabled={index === 0}
              aria-label={`${entry.name} 앞으로 이동`}>←</Button>
            <Button type="button" onClick={() => move(entry.id, 1)} disabled={index === binder.cards.length - 1}
              aria-label={`${entry.name} 뒤로 이동`}>→</Button>
            <Button type="button" onClick={() => edit((item) => ({ ...item, cards: item.cards.filter((id) => id !== entry.id) }))}
              aria-label={`${entry.name} 바인더에서 빼기`}>빼기</Button>
          </div>
        );
      }} />}
      <div className="action-row">
        <ShareLink to={{ pathname: '/binder/', search: shareParams.toString() }}>바인더 공유</ShareLink>
        <Button type="button" onClick={onDelete}>바인더 삭제</Button>
      </div>
    </section>
  );
}

export function SharedBinder() {
  const [params] = useSearchParams();
  const title = params.get('title')?.trim().slice(0, 60) || '공유 바인더';
  const entries = parsePokemonIds(params.get('cards'), cardLimit).map((id) => entryById.get(id));
  return (
    <main className="workspace page-column">
      <h1>{title}</h1>
      {entries.length === 0 ? (
        <EmptyState title="공유된 포켓몬이 없어요."
          description={<>도감에서 다양한 포켓몬을 만나고<br />나만의 컬렉션을 시작해 보세요.</>}>
          <Button asChild variant="default" className="no-underline"><Link to="/">도감 둘러보기</Link></Button>
        </EmptyState>
      ) : <PokeCardList entries={entries} />}
    </main>
  );
}

function Backup() {
  const { data, update } = useCollection();
  const [status, setStatus] = useState(null);
  const backupInput = useRef(null);

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
    <section className="section-stack" aria-label="컬렉션 백업">
      <div className="action-row">
        <Button type="button" onClick={download}>백업 내보내기</Button>
        <Button aria-describedby="backup-merge" onClick={() => backupInput.current?.click()}>백업 가져오기</Button>
        <span id="backup-merge" className="meta-badge">기존 기록에 병합</span>
        <input ref={backupInput} hidden aria-label="백업 파일" type="file" accept=".json,application/json" onChange={restore} />
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
