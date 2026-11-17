import { useState } from 'react';
import { spriteUrl } from '../dex/catalogue';

export default function PokemonSprite({ entry, silhouette = false }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <span className="sprite-empty" aria-hidden="true">?</span>;
  }
  return (
    <img
      className={silhouette ? 'pokemon-silhouette' : undefined}
      src={spriteUrl(entry.id)}
      alt=""
      loading={silhouette ? 'eager' : 'lazy'}
      onError={() => setFailed(true)}
    />
  );
}
