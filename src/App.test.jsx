import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import App from './App';

const api = 'https://pokeapi.co/api/v2';
const image = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/10001.png';
const resource = (kind, id, name) => ({ name, url: `${api}/${kind}/${id}/` });
const korean = (name) => ({ language: { name: 'ko' }, name });
const variant = {
  name: 'deoxys-attack',
  species: resource('pokemon-species', 386, 'deoxys'),
  sprites: { front_default: image, back_default: null, front_shiny: 'https://example.test/shiny.png' },
  cries: { latest: 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/10001.ogg' },
  height: 17,
  weight: 608,
  types: [{ type: resource('type', 14, 'psychic') }],
  abilities: [{ ability: resource('ability', 46, 'pressure') }],
  stats: [{ stat: { name: 'attack' }, base_stat: 180 }],
};

const variantResponses = {
  '/pokemon/10001/': variant,
  '/pokemon-species/386/': {
    id: 386,
    name: 'deoxys',
    names: [korean('테오키스')],
    flavor_text_entries: [{ language: { name: 'ko' }, version: { name: 'emerald' }, flavor_text: '우주에서\n온 포켓몬.' }],
  },
  '/type/14/': { names: [korean('에스퍼')] },
  '/ability/46/': {
    names: [korean('프레셔')],
    flavor_text_entries: [{ language: { name: 'ko' }, flavor_text: '상대의 PP를\n더 많이 줄인다.' }],
  },
};

let queryClient;

const appUrl = (path) => import.meta.env.BASE_URL + path.replace(/^\//, '');

function start(path, responses = {}) {
  window.history.replaceState(null, '', appUrl(path));
  const fetch = vi.fn(async (input) => {
    const url = String(input);
    const response = responses[url.slice(api.length)];
    if (!url.startsWith(`${api}/`) || response === undefined) {
      throw new Error(`Unexpected request: ${url}`);
    }
    const value = typeof response === 'function' ? await response() : response;
    return typeof value === 'number' ? new Response(null, { status: value }) : Response.json(value);
  });

  vi.stubGlobal('fetch', fetch);
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={queryClient}><App /></QueryClientProvider>);
  return fetch;
}

async function chooseOption(field, name) {
  const trigger = await screen.findByRole('combobox', { name: field });
  fireEvent.keyDown(trigger, { key: 'Enter' });
  const option = await screen.findByRole('option', { name });
  fireEvent.keyDown(option, { key: 'Enter' });
}

const originalScrollIntoView = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollIntoView');
beforeAll(() => {
  Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: () => {} });
});
afterAll(() => {
  if (originalScrollIntoView) {
    Object.defineProperty(Element.prototype, 'scrollIntoView', originalScrollIntoView);
  } else {
    delete Element.prototype.scrollIntoView;
  }
});

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.stubGlobal('scrollTo', vi.fn());
});
afterEach(() => {
  cleanup();
  queryClient?.clear();
  vi.unstubAllGlobals();
});

test('opens a form directly, shows the national number and keeps measurements without a back sprite', async () => {
  const fetch = start('/pokemon/10001/', {
    ...variantResponses,
    '/pokemon/10002/': { ...variant, name: 'deoxys-defense' },
  });

  await screen.findByRole('heading', { name: '테오키스' });
  expect(screen.getByText('No. 386')).toBeTruthy();
  expect(screen.getByText('테오키스 · 어택폼', { selector: 'header p' })).toBeTruthy();
  expect(await screen.findByRole('link', { name: '테오키스 · 디펜스폼' })).toBeTruthy();
  expect(screen.getByRole('img', { name: '테오키스 앞모습' })).toBeTruthy();
  expect(screen.queryByRole('img', { name: /뒷모습/ })).toBeNull();
  expect(screen.getByText('60.8 kg')).toBeTruthy();
  expect(screen.getByText('우주에서 온 포켓몬.')).toBeTruthy();
  expect(screen.getByLabelText('테오키스 울음소리').getAttribute('preload')).toBe('none');
  await userEvent.click(screen.getByRole('button', { name: '색이 다른 모습 보기' }));
  expect(screen.getByRole('img', { name: '테오키스 색이 다른 앞모습' })).toBeTruthy();

  const ability = await screen.findByRole('button', { name: '프레셔' });
  await userEvent.click(ability);
  expect(ability.getAttribute('aria-expanded')).toBe('true');
  expect(screen.getByText('상대의 PP를 더 많이 줄인다.')).toBeTruthy();
  await userEvent.click(screen.getByRole('link', { name: '테오키스 · 디펜스폼' }));
  await screen.findByText('테오키스 · 디펜스폼', { selector: 'header p' });
  await screen.findByText('프레셔');
  const requests = fetch.mock.calls.map(([url]) => String(url));
  expect(requests).not.toContain(`${api}/pokemon-species/10001/`);
  for (const path of ['/pokemon-species/386/', '/type/14/', '/ability/46/']) {
    expect(requests.filter((url) => url === api + path)).toHaveLength(1);
  }
});

test('searches unloaded forms by Korean or English name and supports national-number filters, table view and random draw', async () => {
  const fetch = start('/');
  const search = screen.getByRole('searchbox', { name: '포켓몬 검색' });

  fireEvent.change(search, { target: { value: '테오키스 어택폼' } });
  expect(await screen.findByRole('link', { name: 'No. 386 테오키스 · 어택폼' })).toBeTruthy();
  fireEvent.change(search, { target: { value: 'deoxys-attack' } });
  await screen.findByRole('link', { name: 'No. 386 테오키스 · 어택폼' });
  fireEvent.change(search, { target: { value: '025' } });
  await chooseOption('타입', '전기');
  await chooseOption('세대', '1세대');
  await chooseOption('약점', '땅');
  await userEvent.click(screen.getByRole('button', { name: '랜덤 카드 뽑기' }));
  expect(within(screen.getByRole('region', { name: '뽑은 카드' })).getByRole('link', { name: /피카츄/ })).toBeTruthy();
  await userEvent.click(screen.getByRole('button', { name: '표 보기' }));
  expect(within(screen.getByRole('table')).getByRole('link', { name: '피카츄' })).toBeTruthy();
  expect(new URLSearchParams(window.location.search).get('type')).toBe('electric');
  await chooseOption('타입', '전체');
  expect(new URLSearchParams(window.location.search).has('type')).toBe(false);
  expect(fetch).not.toHaveBeenCalled();
});

test('opens the card without a separate flip button and preserves the search on return', async () => {
  start('/', variantResponses);
  const list = screen.getByRole('list', { name: '포켓몬 목록' });
  expect(within(list).getAllByRole('listitem')).toHaveLength(20);
  await userEvent.click(screen.getByRole('button', { name: '더 보기' }));
  expect(within(list).getAllByRole('listitem')).toHaveLength(40);

  fireEvent.change(screen.getByRole('searchbox', { name: '포켓몬 검색' }), { target: { value: 'deoxys-attack' } });
  const card = await screen.findByRole('link', { name: 'No. 386 테오키스 · 어택폼' });
  expect(screen.queryByRole('button', { name: /카드 뒤집기/ })).toBeNull();

  card.focus();
  await userEvent.keyboard('{Enter}');
  await screen.findByRole('heading', { name: '테오키스' });
  expect(window.location.pathname).toBe(appUrl('/pokemon/10001/'));
  await userEvent.click(screen.getByRole('button', { name: /도감 목록으로/ }));
  await screen.findByRole('searchbox', { name: '포켓몬 검색' });
  expect(new URLSearchParams(window.location.search).get('q')).toBe('deoxys-attack');
});

test('saves favorites by form and caught records by national species number', async () => {
  start('/pokemon/10001/', variantResponses);
  await userEvent.click(await screen.findByRole('button', { name: '즐겨찾기 추가' }));
  await userEvent.click(screen.getByRole('button', { name: '잡은 포켓몬으로 등록' }));
  await userEvent.click(screen.getByRole('button', { name: '색이 다른 모습 등록' }));
  await userEvent.click(screen.getByRole('link', { name: '내 컬렉션' }));

  expect(await screen.findByRole('link', { name: 'No. 386 테오키스 · 어택폼' })).toBeTruthy();
  await userEvent.click(screen.getByRole('link', { name: '도감 체크' }));
  expect((await screen.findByRole('progressbar')).getAttribute('aria-valuenow')).toBe('1');
  await chooseOption('도감', '관동');
  expect(screen.getByText('0 / 151 등록 · 0%')).toBeTruthy();
  const state = JSON.parse(localStorage.getItem('poke-dict-collection'));
  expect(state.caught).toEqual(['386']);
  expect(state.shiny).toEqual(['10001']);
  expect(state.recent).toEqual(['10001']);
});

test('creates a binder, adds cards, reorders them and shares the display order', async () => {
  start('/collection/?tab=binders');
  await userEvent.click(await screen.findByRole('button', { name: '바인더 이름 입력하기' }));
  expect(document.activeElement).toBe(screen.getByLabelText('새 바인더 이름'));
  await userEvent.type(await screen.findByLabelText('새 바인더 이름'), '내 카드');
  await userEvent.click(screen.getByRole('button', { name: '바인더 만들기' }));

  const search = await screen.findByRole('searchbox', { name: '도감에서 카드 추가' });
  await userEvent.click(screen.getByRole('button', { name: '포켓몬 추가하기' }));
  expect(document.activeElement).toBe(search);
  fireEvent.change(search, { target: { value: '025' } });
  await userEvent.click(screen.getByRole('button', { name: 'No. 025 피카츄' }));
  expect(screen.queryByText('아직 바인더에 포켓몬이 없어요.')).toBeNull();
  fireEvent.change(search, { target: { value: '001' } });
  await userEvent.click(screen.getByRole('button', { name: 'No. 001 이상해씨' }));
  await userEvent.click(screen.getByRole('button', { name: '이상해씨 앞으로 이동' }));
  const list = screen.getByRole('list', { name: '포켓몬 목록' });
  expect(within(list).getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([appUrl('/pokemon/1/'), appUrl('/pokemon/25/')]);

  vi.stubGlobal('navigator', { ...navigator, clipboard: undefined });
  await userEvent.click(screen.getByRole('button', { name: '바인더 공유' }));
  const url = new URL((await screen.findByLabelText('공유 주소')).value);
  expect(url.pathname).toBe(appUrl('/binder/'));
  expect(url.searchParams.get('cards')).toBe('1,25');
});

test('opens a shared binder independently of the collection', async () => {
  start('/binder/?title=Starter&cards=4,1,999999,4');
  await screen.findByRole('heading', { name: 'Starter' });
  const list = screen.getByRole('list', { name: '포켓몬 목록' });
  expect(within(list).getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([appUrl('/pokemon/4/'), appUrl('/pokemon/1/')]);
});

test('opens the data guide and backup management from the footer without changing collection records', async () => {
  const fetch = start('/collection/');
  const before = localStorage.getItem('poke-dict-collection');
  const footer = screen.getByRole('contentinfo', { name: '사이트 정보' });

  await userEvent.click(within(footer).getByRole('link', { name: '이용·데이터 안내' }));

  await screen.findByRole('heading', { name: '이용 및 데이터 안내', level: 1 });
  expect(document.title).toBe('이용 및 데이터 안내 | Poke-Dict');
  expect(screen.getByRole('heading', { name: '이 브라우저에 보관하는 기록' })).toBeTruthy();
  expect(screen.getByRole('link', { name: 'PokéAPI 라이선스' }).getAttribute('href')).toBe(appUrl('/pokeapi-license.txt'));
  expect(localStorage.getItem('poke-dict-collection')).toBe(before);
  expect(fetch).not.toHaveBeenCalled();

  await userEvent.click(within(footer).getByRole('link', { name: '백업 관리' }));
  expect(await screen.findByRole('region', { name: '컬렉션 백업' })).toBeTruthy();
  expect(window.location.search).toBe('?tab=backup');
});

test('keeps local Pokémon insights visible when the external API fails and clears SEO state on a private route', async () => {
  start('/pokemon/6/');
  const overview = screen.getByRole('region', { name: '핵심 정보' });
  expect(within(overview).getByText(/바위 4배/)).toBeTruthy();
  expect(within(overview).getByText(/특성·도구·필드·테라스탈은 반영하지 않습니다/)).toBeTruthy();
  await screen.findByRole('alert');
  expect(document.querySelector('meta[property="og:title"]').content).toContain('리자몽');
  expect(JSON.parse(document.getElementById('page-structured-data').textContent)['@graph'].some(item => item['@type'] === 'BreadcrumbList')).toBe(true);

  await userEvent.click(screen.getByRole('link', { name: '내 팀' }));
  await screen.findByRole('heading', { name: '내 팀' });
  expect(document.getElementById('page-structured-data')).toBeNull();
  expect(document.querySelector('link[rel="canonical"]')).toBeNull();
  expect(document.querySelector('meta[property="og:title"]').content).toBe('내 팀 | Poke-Dict');
});

test('navigates from a type directory through an explanatory guide to a working comparison', async () => {
  start('/types/electric/');
  await screen.findByRole('heading', { name: '전기 타입 포켓몬 도감', level: 1 });
  expect(screen.getByRole('link', { name: 'No. 025 피카츄' })).toBeTruthy();
  await userEvent.click(screen.getByRole('link', { name: '도감 활용 가이드' }));
  await userEvent.click(await screen.findByRole('link', { name: /종족값과 실제 능력치의 차이/ }));
  await screen.findByRole('heading', { name: '종족값과 실제 능력치의 차이, 비교할 때 볼 것', level: 1 });
  expect(JSON.parse(document.getElementById('page-structured-data').textContent)['@graph'].some(item => item['@type'] === 'Article')).toBe(true);
  await userEvent.click(screen.getByRole('link', { name: '피카츄와 라이츄 비교' }));
  expect(await screen.findByRole('region', { name: '포켓몬 비교표' })).toBeTruthy();
  expect(window.location.search).toBe('?pokemon=25,26');
});

test('takes an empty shared binder visitor to the catalogue', async () => {
  start('/binder/?title=Empty');
  await screen.findByText('공유된 포켓몬이 없어요.');
  await userEvent.click(screen.getByRole('link', { name: '도감 둘러보기' }));
  expect(await screen.findByRole('list', { name: '포켓몬 목록' })).toBeTruthy();
});

test.each(['card', 'table'])('resets empty catalogue filters while keeping the %s view and sort order', async (view) => {
  start(`/?q=zzzzzz&type=electric&gen=1&weakness=ground&caught=caught&page=4&sort=name&view=${view}&other=keep`);
  await screen.findByText('검색 결과가 없어요.');

  await userEvent.click(screen.getByRole('button', { name: '검색 조건 초기화' }));

  expect(screen.getByRole('searchbox', { name: '포켓몬 검색' }).value).toBe('');
  expect(Object.fromEntries(new URLSearchParams(window.location.search))).toEqual({ sort: 'name', view, other: 'keep' });
  expect(view === 'table' ? screen.getByRole('table') : screen.getByRole('list', { name: '포켓몬 목록' })).toBeTruthy();
  expect(screen.queryByText('검색 결과가 없어요.')).toBeNull();
});

test('resets an empty move search to the full move list', async () => {
  start('/moves/?q=zzzzzz&type=fire&other=keep');
  await userEvent.click(await screen.findByRole('button', { name: '검색 조건 초기화' }));
  expect(screen.getByRole('searchbox', { name: '기술 검색' }).value).toBe('');
  expect(window.location.search).toBe('?other=keep');
  expect(screen.getByRole('table')).toBeTruthy();
  expect(screen.queryByText('검색 결과가 없어요.')).toBeNull();
});

test('focuses the comparison picker from the empty state and removes the guidance after selection', async () => {
  start('/compare/');
  await userEvent.click(await screen.findByRole('button', { name: '포켓몬 선택하기' }));
  const search = screen.getByRole('searchbox', { name: '첫 번째 포켓몬 선택' });
  expect(document.activeElement).toBe(search);
  await userEvent.type(search, '025');
  await userEvent.click(screen.getByRole('button', { name: 'No. 025 피카츄' }));
  expect(screen.queryByText('아직 비교할 포켓몬이 없어요.')).toBeNull();
  expect(screen.getByRole('region', { name: '포켓몬 비교표' })).toBeTruthy();
});

test('shares catalogue results without including local collection filters or unrelated query parameters', async () => {
  start('/?q=pikachu&type=electric&caught=missing&page=2&other=private');
  vi.stubGlobal('navigator', { ...navigator, clipboard: undefined });
  await userEvent.click(screen.getByRole('button', { name: '검색 조건 공유' }));
  const url = new URL((await screen.findByLabelText('공유 주소')).value);
  expect(Object.fromEntries(url.searchParams)).toEqual({ q: 'pikachu', type: 'electric' });
});

test('shows a toast outside the search panel when the share link is copied', async () => {
  start('/?q=pikachu&type=electric');
  const writeText = vi.fn().mockResolvedValue(undefined);
  vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });

  await userEvent.click(screen.getByRole('button', { name: '검색 조건 공유' }));

  const notifications = screen.getByRole('region', { name: /알림/ });
  expect(await within(notifications).findByText('링크를 복사했어요.')).toBeTruthy();
  const searchPanel = screen.getByRole('region', { name: '도감 검색' });
  expect(within(searchPanel).queryByText('링크를 복사했어요.')).toBeNull();
  expect(screen.queryByLabelText('공유 주소')).toBeNull();
  const url = new URL(writeText.mock.calls[0][0]);
  expect(url.pathname + url.search).toBe(appUrl('/?q=pikachu&type=electric'));
});

test('loads a shared comparison and uses type combinations for team resistances', async () => {
  start('/compare/?pokemon=6,10001');
  const table = await screen.findByRole('table');
  expect(within(table).getByRole('link', { name: /테오키스/ })).toBeTruthy();
  expect(within(within(table).getByRole('row', { name: /^공격/ })).getByText('180')).toBeTruthy();

  await userEvent.click(screen.getByRole('link', { name: '내 팀' }));
  const picker = await screen.findByRole('searchbox', { name: '팀에 추가할 포켓몬' });
  await userEvent.click(screen.getByRole('button', { name: '포켓몬 추가하기' }));
  expect(document.activeElement).toBe(picker);
  fireEvent.change(picker, { target: { value: '006' } });
  await userEvent.click(screen.getByRole('button', { name: 'No. 006 리자몽' }));
  expect(screen.queryByText('아직 팀에 포켓몬이 없어요.')).toBeNull();
  const teamTable = screen.getByRole('region', { name: '팀 방어 상성표' });
  const ground = within(teamTable).getByRole('row', { name: /땅/ });
  expect(within(ground).getAllByRole('cell').map((cell) => cell.textContent)).toEqual(['0마리', '0마리', '1마리']);
});

test('filters learning and encounters by the selected game version and shows verified Kanto map markers', async () => {
  const pikachu = {
    ...variant,
    name: 'pikachu',
    species: resource('pokemon-species', 25, 'pikachu'),
    types: [{ type: resource('type', 13, 'electric') }],
    abilities: [],
    moves: [{
      move: resource('move', 33, 'tackle'),
      version_group_details: [{
        version_group: { name: 'red-blue' }, move_learn_method: { name: 'level-up' }, level_learned_at: 5,
      }],
    }],
  };

  start('/pokemon/25/', {
    '/pokemon/25/': pikachu,
    '/pokemon-species/25/': { id: 25, names: [korean('피카츄')] },
    '/type/13/': { names: [korean('전기')] },
    '/pokemon/25/encounters': [{
      location_area: resource('location-area', 0, 'silph-co'),
      version_details: [
        { version: { name: 'red' }, encounter_details: [{ method: { name: 'walk' }, min_level: 3, max_level: 5 }] },
      ],
    }, {
      location_area: resource('location-area', 321, 'viridian-forest-area'),
      version_details: [
        { version: { name: 'red' }, encounter_details: [{ method: { name: 'walk' }, min_level: 3, max_level: 5, condition_values: [{ name: 'time-day' }] }] },
      ],
    }, {
      location_area: resource('location-area', 330, 'kanto-power-plant-area'),
      version_details: [
        { version: { name: 'red' }, encounter_details: [{ method: { name: 'walk' }, min_level: 20, max_level: 24 }] },
      ],
    }],
  });

  await userEvent.click(await screen.findByText('게임별 기술과 출현 정보'));
  await chooseOption('게임 버전', '레드');
  expect(screen.getByRole('link', { name: '몸통박치기' }).getAttribute('href')).toBe(appUrl('/moves/33/'));
  await userEvent.click(screen.getByRole('button', { name: '출현·획득 방법' }));
  const map = await screen.findByRole('region', { name: '관동 출현 지도' });
  expect(within(map).getAllByRole('button')).toHaveLength(2);
  expect(within(map).getByRole('button', { name: 'kanto power plant' })).toBeTruthy();
  expect(screen.getByText('걷기 · Lv. 3–5 · 낮')).toBeTruthy();
  await chooseOption('게임 버전', '스칼렛');
  expect(screen.getByText('이 버전의 야생 출현 기록이 없어요.')).toBeTruthy();
  expect(screen.queryByRole('region', { name: '관동 출현 지도' })).toBeNull();
});

test('uses the quiz card to reveal the daily answer and remembers the reveal', async () => {
  start('/quiz/');
  await screen.findByRole('heading', { name: '오늘의 실루엣' });
  await userEvent.click(screen.getByRole('button', { name: '정답 공개' }));
  expect(screen.getByRole('link', { name: '포켓몬 상세 보기' })).toBeTruthy();
  expect(document.querySelector('.pokemon-card--quiz').dataset.flipped).toBe('true');
  await userEvent.click(screen.getByRole('link', { name: '도감' }));
  await userEvent.click(screen.getByRole('link', { name: '퀴즈' }));
  expect(await screen.findByRole('link', { name: '포켓몬 상세 보기' })).toBeTruthy();
});

test('shows a missing Pokémon state with a link back to the catalogue', async () => {
  start('/pokemon/99999999/', { '/pokemon/99999999/': 404 });
  await screen.findByText('포켓몬을 찾을 수 없어요.');
  expect(screen.getByRole('link', { name: /도감 목록으로/ }).getAttribute('href')).toBe(appUrl('/'));
});

test('opens an existing hash share link at its clean address and keeps its search parameters', async () => {
  start('/index.html#/binder?title=Starter&cards=4,1#cards');
  await screen.findByRole('heading', { name: 'Starter' });
  expect(window.location.pathname).toBe(appUrl('/binder/'));
  expect(window.location.search).toBe('?title=Starter&cards=4,1');
  expect(window.location.hash).toBe('#cards');
  expect(document.querySelector('meta[name="robots"]')?.content).toBe('noindex');
});

test('redirects the old detail address without a Pokémon ID to the catalogue', async () => {
  start('#/detail');
  await screen.findByRole('searchbox', { name: '포켓몬 검색' });
  expect(window.location.pathname).toBe(appUrl('/'));
  expect(window.location.hash).toBe('');
});

test('keeps detail visible when its species resource points outside PokéAPI', async () => {
  const fetch = start('/pokemon/10001/', {
    ...variantResponses,
    '/pokemon/10001/': { ...variant, species: { url: 'https://other.example/pokemon-species/386/' } },
  });

  expect((await screen.findByRole('alert')).textContent).toBe('한국어 도감 정보를 불러오지 못했어요.');
  expect(screen.getByRole('heading', { name: '테오키스' })).toBeTruthy();
  expect(fetch.mock.calls.every(([url]) => String(url).startsWith(`${api}/`))).toBe(true);
});

test('retains the loaded page when returning from the list to the same results', async () => {
  const pokemon = { ...variant, species: resource('pokemon-species', 25, 'pikachu'), abilities: [], types: [] };
  start('/?page=2', {
    '/pokemon/25/': pokemon,
    '/pokemon-species/25/': { id: 25, names: [korean('피카츄')] },
  });

  await userEvent.click(screen.getByRole('link', { name: 'No. 025 피카츄' }));
  await screen.findByRole('button', { name: /도감 목록으로/ });
  await userEvent.click(screen.getByRole('button', { name: /도감 목록으로/ }));
  const list = await screen.findByRole('list', { name: '포켓몬 목록' });
  expect(within(list).getAllByRole('listitem')).toHaveLength(40);
});

test('restores the catalogue scroll position after detail and keeps it when loading more cards', async () => {
  // Given a catalogue that has already been scrolled and expanded.
  start('/?page=2');
  vi.stubGlobal('scrollY', 1200);
  fireEvent.scroll(window);

  // When opening a detail and returning through its back button.
  await userEvent.click(screen.getByRole('link', { name: 'No. 025 피카츄' }));
  expect(window.scrollTo).toHaveBeenLastCalledWith(0, 0);
  vi.stubGlobal('scrollY', 0);
  fireEvent.scroll(window);
  await userEvent.click(await screen.findByRole('button', { name: /도감 목록으로/ }));

  // Then the saved position and loaded cards are restored without resetting on expansion.
  const list = await screen.findByRole('list', { name: '포켓몬 목록' });
  expect(window.scrollTo).toHaveBeenLastCalledWith(0, 1200);
  expect(within(list).getAllByRole('listitem')).toHaveLength(40);
  vi.stubGlobal('scrollY', 1200);
  fireEvent.scroll(window);
  window.scrollTo.mockClear();
  await userEvent.click(screen.getByRole('button', { name: '더 보기' }));
  expect(within(list).getAllByRole('listitem')).toHaveLength(60);
  expect(window.scrollTo).not.toHaveBeenCalled();
});

test('restores the expanded catalogue position after a page reload', async () => {
  // Given a scrolled catalogue before the document is replaced.
  start('/?page=2');
  vi.stubGlobal('scrollY', 1200);
  fireEvent.scroll(window);
  fireEvent(window, new Event('pagehide'));
  cleanup();
  queryClient.clear();

  // When a new app instance opens the same history entry.
  vi.stubGlobal('scrollY', 0);
  start('/?page=2');

  // Then the scroll position and expanded result count survive the reload.
  const list = await screen.findByRole('list', { name: '포켓몬 목록' });
  expect(window.scrollTo).toHaveBeenLastCalledWith(0, 1200);
  expect(within(list).getAllByRole('listitem')).toHaveLength(40);
});

test('does not reuse a fresh history entry scroll position at a different address', async () => {
  start('/?page=2');
  vi.stubGlobal('scrollY', 1200);
  fireEvent.scroll(window);
  fireEvent(window, new Event('pagehide'));
  cleanup();
  queryClient.clear();

  vi.stubGlobal('scrollY', 0);
  start('/collection/');
  await screen.findByRole('heading', { name: '내 컬렉션' });
  expect(window.scrollTo).toHaveBeenLastCalledWith(0, 0);
});

test('keeps catalogue navigation working when session storage is unavailable', async () => {
  vi.stubGlobal('sessionStorage', {
    getItem() { throw new Error('Storage unavailable'); },
    setItem() { throw new Error('Storage unavailable'); },
  });
  start('/?page=2');
  vi.stubGlobal('scrollY', 1200);
  fireEvent.scroll(window);
  await userEvent.click(screen.getByRole('link', { name: 'No. 025 피카츄' }));
  await userEvent.click(await screen.findByRole('button', { name: /도감 목록으로/ }));
  await screen.findByRole('list', { name: '포켓몬 목록' });
  expect(window.scrollTo).toHaveBeenLastCalledWith(0, 1200);
});

test('merges a full backup without discarding local binders or filling team slots with unknown IDs', async () => {
  start('/collection/?tab=binders');
  await userEvent.type(await screen.findByLabelText('새 바인더 이름'), '먼저 만든 바인더');
  await userEvent.click(screen.getByRole('button', { name: '바인더 만들기' }));
  await userEvent.click(screen.getByRole('link', { name: '백업' }));
  const backup = {
    version: 1,
    favorites: ['25'],
    caught: ['25'],
    shiny: [],
    recent: [],
    team: Array.from({ length: 6 }, (_, index) => String(600000 + index)),
    binders: Array.from({ length: 100 }, (_, index) => ({
      id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`, name: `백업 ${index}`, cards: ['25'],
    })),
  };
  const file = new File([JSON.stringify(backup)], 'poke-dict-backup.json', { type: 'application/json' });
  if (typeof file.text !== 'function') {
    Object.defineProperty(file, 'text', { value: async () => JSON.stringify(backup) });
  }
  await userEvent.upload(screen.getByLabelText('백업 파일'), file);
  await screen.findByText('백업을 현재 기록에 합쳤어요.');
  await userEvent.click(screen.getByRole('link', { name: '바인더', exact: true }));
  const binder = screen.getByRole('region', { name: '먼저 만든 바인더' });
  expect(within(binder).getByRole('textbox', { name: '바인더 이름' }).value).toBe('먼저 만든 바인더');

  await userEvent.click(screen.getByRole('link', { name: '내 팀' }));
  fireEvent.change(await screen.findByRole('searchbox', { name: '팀에 추가할 포켓몬' }), { target: { value: '025' } });
  await userEvent.click(screen.getByRole('button', { name: 'No. 025 피카츄' }));
  expect(screen.getByRole('link', { name: 'No. 025 피카츄' })).toBeTruthy();
});

test('shows a regional evolution recipe only on the matching evolved form', async () => {
  const raichu = { ...variant, name: 'raichu', is_default: true, types: [], abilities: [],
    forms: [{ name: 'raichu' }], species: resource('pokemon-species', 26, 'raichu') };
  const pikachu = resource('pokemon-species', 25, 'pikachu');
  start('/pokemon/26/', {
    '/pokemon/26/': raichu,
    '/pokemon/10100/': { ...raichu, name: 'raichu-alola', is_default: false, forms: [{ name: 'raichu-alola' }] },
    '/pokemon-species/26/': {
      id: 26, name: 'raichu', names: [korean('라이츄')], evolves_from_species: pikachu,
      evolution_chain: resource('evolution-chain', 10, 'raichu-chain'),
    },
    '/evolution-chain/10/': {
      chain: { species: pikachu, evolves_to: [{ species: raichu.species, evolves_to: [], evolution_details: [{
        version_group: { name: 'sun-moon' }, evolved_pokemon_form: { name: 'raichu-alola' }, trigger: { name: 'use-item' },
        item: { name: 'thunder-stone' }, region: { name: 'alola' },
      }] }] },
    },
    '/pokemon/26/encounters': [],
    '/pokemon/10100/encounters': [],
  });

  async function showSunLocations() {
    await userEvent.click(await screen.findByText('게임별 기술과 출현 정보'));
    await chooseOption('게임 버전', '썬');
    await userEvent.click(screen.getByRole('button', { name: '출현·획득 방법' }));
    await screen.findByText('이 버전의 야생 출현 기록이 없어요.');
  }

  await showSunLocations();
  expect(screen.queryByRole('heading', { name: '진화로 획득' })).toBeNull();
  await userEvent.click(screen.getByRole('link', { name: '라이츄 · 알로라의 모습' }));
  await showSunLocations();
  expect(await screen.findByText('도구 사용 · 사용 도구 thunder stone · 지방 alola')).toBeTruthy();
});

test('opens a technique from the move dex and links the Pokémon that can learn it', async () => {
  start('/moves/?q=몸통박치기', {
    '/move/33/': {
      flavor_text_entries: [{ language: { name: 'ko' }, flavor_text: '몸 전체를 부딪쳐 공격한다.' }],
      damage_class: { name: 'physical' },
      learned_by_pokemon: [resource('pokemon', 1, 'bulbasaur')],
    },
  });
  await userEvent.click(await screen.findByRole('link', { name: '몸통박치기' }));
  expect(await screen.findByText('몸 전체를 부딪쳐 공격한다.')).toBeTruthy();
  expect(screen.getByRole('link', { name: 'No. 001 이상해씨' }).getAttribute('href')).toBe(appUrl('/pokemon/1/'));
});
