export default function DetailImageBox({ pokemon, name }) {
  const { front_default: front, back_default: back } = pokemon.sprites;

  return (
    <section className="panel detail-images" aria-label="모습과 신체 정보">
      <div className="detail-images__sprites">
        {front && <img src={front} alt={`${name} 앞모습`} />}
        {back && <img src={back} alt={`${name} 뒷모습`} />}
      </div>
      <dl className="measurements">
        <div><dt>키</dt><dd>{pokemon.height / 10} m</dd></div>
        <div><dt>몸무게</dt><dd>{pokemon.weight / 10} kg</dd></div>
      </dl>
    </section>
  );
}
