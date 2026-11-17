import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';

const API = new URL('https://pokeapi.co/api/v2/');
const PAGE_SIZE = 20;
const RESOURCE_STALE_TIME = 60 * 60 * 1000;
const RESOURCE_CACHE_TIME = RESOURCE_STALE_TIME;

export function pokemonListOptions() {
  return infiniteQueryOptions({
    queryKey: ['pokemon-list'],
    initialPageParam: new URL(`pokemon/?limit=${PAGE_SIZE}&offset=0`, API).href,
    queryFn: async ({ pageParam, signal }) => {
      const page = await fetchPokemonListPage(pageParam, signal);
      return {
        pokemon: page.results.map(({ name, url }) => {
          const id = resourceId(url, 'pokemon');
          if (!id) {
            throw new Error('Invalid PokéAPI resource URL');
          }
          return { id, name };
        }),
        next: page.next,
      };
    },
    getNextPageParam: (page) => page.next ?? undefined,
    staleTime: RESOURCE_STALE_TIME,
  });
}

async function fetchPokemonListPage(value, signal) {
  const url = apiUrl(value);
  if (url.pathname !== '/api/v2/pokemon/') {
    throw new Error('Invalid PokéAPI list URL');
  }
  return fetchJson(url, signal);
}

export function isPokemonId(value) {
  return typeof value === 'string' && /^[1-9][0-9]*$/.test(value);
}

export function pokemonOptions(id) {
  return queryOptions({
    queryKey: ['pokemon', id],
    enabled: isPokemonId(id),
    queryFn: ({ signal }) => fetchJson(new URL(`pokemon/${id}/`, API), signal),
    staleTime: RESOURCE_STALE_TIME,
    gcTime: RESOURCE_CACHE_TIME,
  });
}

export function speciesOptions(pokemon) {
  return namedResourceOptions('pokemon-species', pokemon?.species);
}

export function typeOptions(type) {
  return namedResourceOptions('type', type);
}

export function abilityOptions(ability) {
  return namedResourceOptions('ability', ability);
}

function namedResourceOptions(kind, resource) {
  const id = resourceId(resource?.url, kind);
  return queryOptions({
    queryKey: [kind, id ?? resource?.url ?? null],
    enabled: Boolean(resource),
    queryFn: ({ signal }) => {
      if (!id) {
        throw new Error('Invalid PokéAPI resource URL');
      }
      return fetchJson(apiUrl(resource.url), signal);
    },
    staleTime: RESOURCE_STALE_TIME,
    gcTime: RESOURCE_CACHE_TIME,
  });
}

export function koreanName(resource) {
  return resource?.names?.find(({ language }) => language.name === 'ko')?.name;
}

export function koreanAbilityDescription(ability) {
  return ability?.flavor_text_entries?.find(({ language }) => language.name === 'ko')
    ?.flavor_text.replace(/\s+/g, ' ').trim();
}

function resourceId(value, kind) {
  if (typeof value !== 'string') {
    return undefined;
  }
  return value.match(new RegExp(`^https://pokeapi\\.co/api/v2/${kind}/([1-9][0-9]*)/?$`))?.[1];
}

function apiUrl(value) {
  const url = new URL(value);
  if (url.origin !== API.origin || url.username || url.password || url.hash) {
    throw new Error('Invalid PokéAPI origin');
  }
  return url;
}

class PokeApiError extends Error {
  constructor(status) {
    super(`PokéAPI request failed (${status})`);
    this.status = status;
  }
}

async function fetchJson(url, signal) {
  const response = await fetch(url, { signal, credentials: 'omit', redirect: 'error' });
  if (!response.ok) {
    throw new PokeApiError(response.status);
  }
  return response.json();
}
