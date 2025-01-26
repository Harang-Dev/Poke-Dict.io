import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";

const API = "https://pokeapi.co/api/v2";

// 포켓몬 데이터 가져오기 (이름, 이미지 포함)
const fetchPokemons = async (limit, offset) => {
  const response = await axios.get(`${API}/pokemon?limit=${limit}&offset=${offset}`);
  const pokemons = await Promise.all(
    response.data.results.map(async (pokemon) => {
      const id = pokemon.url.split("/").slice(-2)[0];

      // 포켓몬 정보와 함께 이미지와 한국어 이름을 한 번에 가져오기
      const [pokemonData, speciesData] = await Promise.all([
        axios.get(`${API}/pokemon/${id}`),
        axios.get(`${API}/pokemon-species/${id}`)
      ]);

      const image = pokemonData.data.sprites.front_default;
      const koreanNameObj = speciesData.data.names.find(
        (name) => name.language.name === "ko"
      );
      const koreanName = koreanNameObj ? koreanNameObj.name : "No Korean name";

      return { id, name: koreanName, image };
    })
  );

  return pokemons;
};

export const useGetPokemons = () => {
  return useInfiniteQuery({
    queryKey: ['pokemon'],
    queryFn: ({ pageParam = 0 }) => fetchPokemons(20, pageParam * 20),
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.length < 20) {
        return undefined;
      }
      return pages.length;
    },
    initialPageParam: 0,
  });
};