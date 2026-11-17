import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';
import App from './App';

const api = 'https://pokeapi.co/api/v2';
const firstPage = '/pokemon/?limit=20&offset=0';
const nextPage = '/pokemon/?offset=35&limit=20';
const image = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/10001.png';
const result = (id, name) => ({ name, url: `${api}/pokemon/${id}/` });
const resource = (kind, id, name) => ({ name, url: `${api}/${kind}/${id}/` });
const korean = (name) => ({ language: { name: 'ko' }, name });
const variant = {
  name: 'deoxys-attack',
  species: resource('pokemon-species', 386, 'deoxys'),
  sprites: { front_default: image, back_default: null },
  height: 17,
  weight: 608,
  types: [{ type: resource('type', 14, 'psychic') }],
  abilities: [{ ability: resource('ability', 46, 'pressure') }],
  stats: [{ stat: { name: 'attack' }, base_stat: 180 }],
};

let queryClient;

function start(hash, responses) {
  window.history.replaceState(null, '', `/${hash}`);
  const fetch = vi.fn(async (input) => {
    const url = String(input);
    const response = responses[url.slice(api.length)];
    if (!url.startsWith(`${api}/`) || response === undefined) {
      throw new Error(`Unexpected request: ${url}`);
    }
    const value = typeof response === 'function' ? await response() : response;
    return typeof value === 'number'
      ? new Response(null, { status: value })
      : Response.json(value);
  });

  vi.stubGlobal('fetch', fetch);
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={queryClient}><App /></QueryClientProvider>);
  return fetch;
}

afterEach(() => {
  cleanup();
  queryClient?.clear();
  vi.unstubAllGlobals();
});

test('opens a form directly using its species URL and shows measurements without a back sprite', async () => {
  const fetch = start('#/pokemon/10001', {
    '/pokemon/10001/': variant,
    '/pokemon-species/386/': { names: [korean('테오키스')] },
    '/type/14/': { names: [korean('에스퍼')] },
    '/ability/46/': {
      names: [korean('프레셔')],
      flavor_text_entries: [{ language: { name: 'ko' }, flavor_text: '상대의 PP를\n더 많이 줄인다.' }],
    },
  });

  expect(await screen.findByRole('heading', { name: '테오키스' })).toBeTruthy();
  expect(screen.getByText('No. 10001')).toBeTruthy();
  expect(screen.getByRole('img', { name: '테오키스 앞모습' })).toBeTruthy();
  expect(screen.queryByRole('img', { name: /뒷모습/ })).toBeNull();
  expect(screen.getByText('1.7 m')).toBeTruthy();
  expect(screen.getByText('60.8 kg')).toBeTruthy();
  expect(await screen.findByText('에스퍼')).toBeTruthy();
  const ability = await screen.findByText('프레셔');
  expect(ability.closest('details').open).toBe(false);
  await userEvent.click(ability);
  expect(ability.closest('details').open).toBe(true);
  expect(screen.getByText('상대의 PP를 더 많이 줄인다.')).toBeTruthy();
  expect(fetch.mock.calls.map(([url]) => String(url))).not.toContain(`${api}/pokemon-species/10001/`);
});

test('loads only card data on the list and shares type and ability results between details', async () => {
  const fetch = start('#/', {
    [firstPage]: { results: [result(10001, 'deoxys-attack'), result(10002, 'deoxys-defense')], next: null },
    '/pokemon/10001/': variant,
    '/pokemon/10002/': { ...variant, name: 'deoxys-defense' },
    '/pokemon-species/386/': { names: [korean('테오키스')] },
    '/type/14/': { names: [korean('에스퍼')] },
    '/ability/46/': { names: [korean('프레셔')], flavor_text_entries: [] },
  });

  const firstCard = await screen.findByRole('link', { name: 'No. 10001 테오키스' });
  await screen.findByRole('link', { name: 'No. 10002 테오키스' });
  expect(fetch.mock.calls.map(([url]) => String(url)).sort()).toEqual([
    `${api}${firstPage}`,
    `${api}/pokemon/10001/`,
    `${api}/pokemon/10002/`,
    `${api}/pokemon-species/386/`,
  ].sort());

  await userEvent.tab();
  expect(document.activeElement).toBe(firstCard);
  await userEvent.keyboard('{Enter}');
  expect(await screen.findByText('에스퍼')).toBeTruthy();
  await screen.findByText('프레셔');

  await userEvent.click(screen.getByRole('button', { name: /도감 목록으로/ }));
  await userEvent.click(await screen.findByRole('link', { name: 'No. 10002 테오키스' }));
  await screen.findByRole('heading', { name: '테오키스' });
  expect(screen.getByText('에스퍼')).toBeTruthy();
  expect(screen.getByText('프레셔')).toBeTruthy();

  for (const path of ['/pokemon-species/386/', '/type/14/', '/ability/46/']) {
    expect(fetch.mock.calls.filter(([url]) => String(url) === api + path)).toHaveLength(1);
  }
});

test('keeps loaded cards when the next page fails and retries the API-provided next URL', async () => {
  let breakNext = true;
  start('#/', {
    [firstPage]: { results: [result(10001, 'deoxys-attack')], next: api + nextPage },
    [nextPage]: () => breakNext
      ? 503
      : { results: [result(10002, 'deoxys-defense')], next: null },
    '/pokemon/10001/': variant,
    '/pokemon/10002/': { ...variant, name: 'deoxys-defense' },
    '/pokemon-species/386/': { names: [korean('테오키스')] },
  });

  await userEvent.click(await screen.findByRole('button', { name: '더 보기' }));
  expect((await screen.findByRole('alert')).textContent).toBe('포켓몬 목록을 더 불러오지 못했어요.');
  expect(screen.getByRole('link', { name: /No\. 10001/ })).toBeTruthy();

  breakNext = false;
  await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));
  expect(await screen.findByRole('link', { name: 'No. 10002 테오키스' })).toBeTruthy();
  expect(screen.getByRole('status').textContent).toBe('모든 포켓몬을 불러왔어요.');
  expect(screen.queryByRole('button', { name: '더 보기' })).toBeNull();
});

test('distinguishes an initial list failure from successful empty results', async () => {
  let fail = true;
  start('#/', {
    [firstPage]: () => fail ? 503 : { results: [], next: null },
  });

  expect((await screen.findByRole('alert')).textContent).toBe('포켓몬 목록을 불러오지 못했어요.');
  fail = false;
  await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));
  await screen.findByText('표시할 포켓몬이 없어요.');
  expect(screen.queryByRole('alert')).toBeNull();
});

test('lets an individual failed card retry without removing the rest of the list', async () => {
  let fail = true;
  start('#/', {
    [firstPage]: { results: [result(10001, 'deoxys-attack'), result(10002, 'deoxys-defense')], next: null },
    '/pokemon/10001/': () => fail ? 503 : variant,
    '/pokemon/10002/': { ...variant, name: 'deoxys-defense' },
    '/pokemon-species/386/': { names: [korean('테오키스')] },
  });

  const cards = await screen.findAllByRole('listitem');
  expect(await within(cards[0]).findByRole('alert')).toBeTruthy();
  expect(await within(cards[1]).findByRole('link', { name: 'No. 10002 테오키스' })).toBeTruthy();
  fail = false;
  await userEvent.click(within(cards[0]).getByRole('button', { name: '다시 시도' }));
  expect(await within(cards[0]).findByRole('link', { name: 'No. 10001 테오키스' })).toBeTruthy();
});

test('shows a missing Pokémon state for an unknown detail ID', async () => {
  start('#/pokemon/99999999', { '/pokemon/99999999/': 404 });
  await screen.findByText('포켓몬을 찾을 수 없어요.');
  expect(screen.getByRole('link', { name: /도감 목록으로/ }).getAttribute('href')).toBe('#/');
});

test('recovers the old detail address by replacing it with the list', async () => {
  start('#/detail', { [firstPage]: { results: [], next: null } });
  await screen.findByText('표시할 포켓몬이 없어요.');
  expect(window.location.hash).toBe('#/');
});

test('keeps the detail visible when the species URL points outside PokéAPI', async () => {
  const fetch = start('#/pokemon/10001', {
    '/pokemon/10001/': { ...variant, species: { url: 'https://other.example/pokemon-species/386/' } },
    '/type/14/': { names: [korean('에스퍼')] },
    '/ability/46/': { names: [korean('프레셔')], flavor_text_entries: [] },
  });

  expect((await screen.findByRole('alert')).textContent).toBe('한국어 이름을 불러오지 못했어요.');
  expect(screen.getByRole('heading', { name: 'deoxys-attack' })).toBeTruthy();
  expect(fetch.mock.calls.every(([url]) => String(url).startsWith(`${api}/`))).toBe(true);
});
