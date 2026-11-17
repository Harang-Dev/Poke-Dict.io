import { Button } from './ui/button';
import { useRef, useState } from 'react';
import { PauseIcon, PlayIcon } from 'lucide-react';

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
        <Button type="button" aria-pressed={shiny} onClick={() => setShiny(!shiny)}>
          {shiny ? '일반 모습 보기' : '색이 다른 모습 보기'}
        </Button>
      )}
      <dl className="measurements">
        <div><dt>키</dt><dd>{pokemon.height == null ? '—' : `${pokemon.height / 10} m`}</dd></div>
        <div><dt>몸무게</dt><dd>{pokemon.weight == null ? '—' : `${pokemon.weight / 10} kg`}</dd></div>
      </dl>
      {cry && <PokemonCry key={cry} src={cry} name={name} />}
    </section>
  );
}

function PokemonCry({ src, name }) {
  const audio = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  async function toggle() {
    if (!audio.current.paused) {
      audio.current.pause();
      return;
    }
    setFailed(false);
    try {
      await audio.current.play();
    } catch (error) {
      if (error.name !== 'AbortError') {
        setFailed(true);
      }
    }
  }

  return (
    <div className="pokemon-cry">
      <Button onClick={toggle}>
        {playing ? <PauseIcon aria-hidden="true" /> : <PlayIcon aria-hidden="true" />}
        {playing ? '울음소리 일시정지' : '울음소리 재생'}
      </Button>
      <audio ref={audio} preload="none" aria-label={`${name} 울음소리`} src={src}
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}
        onError={() => { setPlaying(false); setFailed(true); }} />
      {failed && <p role="alert">울음소리를 재생하지 못했어요.</p>}
    </div>
  );
}
