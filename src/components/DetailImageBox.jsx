import { useState } from 'react';

export default function DetailImageBox({ pokemon, name }) {
  const [shiny, setShiny] = useState(false);
  const { front_default, back_default, front_shiny, back_shiny } = pokemon.sprites;
  const front = shiny ? front_shiny : front_default;
  const back = shiny ? back_shiny : back_default;
  const cry = pokemon.cries?.latest ?? pokemon.cries?.legacy;

  return (
    <section className="panel detail-images" aria-label="모습과 신체 정보">
      <div className="detail-images__sprites">
        {front && <img src={front} alt={`${name} ${shiny ? '색이 다른 ' : ''}앞모습`} />}
        {back && <img src={back} alt={`${name} ${shiny ? '색이 다른 ' : ''}뒷모습`} />}
      </div>
      {(front_shiny || back_shiny) && (
        <button type="button" aria-pressed={shiny} onClick={() => setShiny(!shiny)}>
          {shiny ? '일반 모습 보기' : '색이 다른 모습 보기'}
        </button>
      )}
      <dl className="measurements">
        <div><dt>키</dt><dd>{pokemon.height == null ? '—' : `${pokemon.height / 10} m`}</dd></div>
        <div><dt>몸무게</dt><dd>{pokemon.weight == null ? '—' : `${pokemon.weight / 10} kg`}</dd></div>
      </dl>
      {cry && (
        <div className="pokemon-cry">
          <strong>울음소리</strong>
          <audio controls preload="none" aria-label={`${name} 울음소리`} src={cry} />
        </div>
      )}
    </section>
  );
}
