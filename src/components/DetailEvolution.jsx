import { pokemonPath } from '../paths';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { evolutionOptions } from '../api/pokeApi';
import { formsOf, speciesByNumber } from '../dex/catalogue';
import RequestError from './RequestError';
import { formatPokemonNumber } from '../pokemonNumber';

export default function DetailEvolution({ id, number, species }) {
  const forms = formsOf(number);
  const chain = useQuery(evolutionOptions(species));

  return (
    <div className="section-stack">
      {forms.length > 1 && (
        <section className="panel">
          <h2>폼</h2>
          <ul className="link-chips">{forms.map((form) => (
            <li key={form.id}>
              <Link to={pokemonPath(form.id)} aria-current={form.id === id ? 'page' : undefined}>{form.name}</Link>
            </li>
          ))}</ul>
        </section>
      )}
      {species?.evolution_chain && (
        <section className="panel">
          <h2>진화 계보</h2>
          {chain.isPending && <p role="status">진화 정보를 불러오는 중…</p>}
          {chain.isError && <RequestError message="진화 정보를 불러오지 못했어요."
            retry={() => chain.refetch()} retrying={chain.isFetching} />}
          {chain.data?.chain && <ul className="evolution-tree"><EvolutionNode node={chain.data.chain} current={number} /></ul>}
        </section>
      )}
    </div>
  );
}

function EvolutionNode({ node, current }) {
  const number = Number(node.species.url?.match(/\/pokemon-species\/(\d+)\/?$/)?.[1]);
  const entry = speciesByNumber.get(number);
  return (
    <li>
      {entry ? (
        <Link to={pokemonPath(entry.id)} aria-current={number === current ? 'page' : undefined}>
          {formatPokemonNumber(number)} {entry.name}
        </Link>
      ) : <span>{node.species.name}</span>}
      {node.evolves_to.length > 0 && (
        <ul>{node.evolves_to.map((child) => <EvolutionNode key={child.species.name} node={child} current={current} />)}</ul>
      )}
    </li>
  );
}
