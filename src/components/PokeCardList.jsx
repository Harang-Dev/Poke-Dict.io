import { useEffect, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { pokemonListOptions } from '../api/pokeApi';
import PokeCard from './PokeCard';
import RequestError from './RequestError';

export default function PokeCardList() {
  const query = useInfiniteQuery(pokemonListOptions());
  const sentinel = useRef(null);
  const { data, fetchNextPage, hasNextPage, isFetching, isError } = query;

  useEffect(() => {
    const target = sentinel.current;
    if (!target || !hasNextPage || isFetching || isError || !window.IntersectionObserver) {
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        void fetchNextPage({ cancelRefetch: false });
      }
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasNextPage, isFetching, isError, fetchNextPage]);

  if (query.isPending) {
    return <p role="status" className="list-status">포켓몬을 불러오는 중…</p>;
  }

  if (isError && !data) {
    return (
      <RequestError
        message="포켓몬 목록을 불러오지 못했어요."
        retry={() => query.refetch()}
        retrying={isFetching}
      />
    );
  }

  const pokemon = data.pages.flatMap((page) => page.pokemon);

  return (
    <>
      {pokemon.length > 0 && (
        <ul className="card-grid" aria-label="포켓몬 목록">
          {pokemon.map((entry) => (
            <li key={entry.id}>
              <PokeCard entry={entry} />
            </li>
          ))}
        </ul>
      )}
      <div className="list-status" ref={sentinel}>
        {isError ? (
          <RequestError
            message="포켓몬 목록을 더 불러오지 못했어요."
            retry={query.isFetchNextPageError || query.isFetchingNextPage
              ? () => fetchNextPage({ cancelRefetch: false })
              : () => query.refetch()}
            retrying={isFetching}
          />
        ) : hasNextPage ? (
          <>
            <button
              type="button"
              aria-disabled={isFetching}
              onClick={() => {
                if (!isFetching) {
                  void fetchNextPage({ cancelRefetch: false });
                }
              }}
            >
              더 보기
            </button>
            {query.isFetchingNextPage && <p role="status">포켓몬을 더 불러오는 중…</p>}
          </>
        ) : (
          <p role="status">
            {pokemon.length > 0 ? '모든 포켓몬을 불러왔어요.' : '표시할 포켓몬이 없어요.'}
          </p>
        )}
      </div>
    </>
  );
}
