import { useEffect, useRef, useState } from 'react';
import PokeCard from './PokeCard';

export const pageSize = 20;

export default function PokeCardList({ entries, fromList = false, shown, onShowMore, renderActions }) {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const count = shown ?? visibleCount;
  const showMore = onShowMore ?? (() => setVisibleCount((current) => current + pageSize));
  const hasMore = count < entries.length;
  const target = useRef(null);

  useEffect(() => {
    const sentinel = target.current;
    if (!fromList || !hasMore || !sentinel || !window.IntersectionObserver) {
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        showMore();
      }
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fromList, hasMore, showMore]);

  if (!entries.length) {
    return <p role="status">표시할 포켓몬이 없어요.</p>;
  }

  return (
    <>
      <ul className="card-grid" aria-label="포켓몬 목록">
        {entries.slice(0, count).map((entry) => (
          <li key={entry.id}>
            <PokeCard entry={entry} fromList={fromList} />
            {renderActions?.(entry)}
          </li>
        ))}
      </ul>
      {hasMore && <div className="list-status" ref={target}><button type="button" onClick={showMore}>더 보기</button></div>}
    </>
  );
}
