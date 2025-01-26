import axios from "axios";
const API = "https://pokeapi.co/api/v2";

// 포켓몬 데이터 가져오기
export const fetchPokemons = async (limit, offset) => {
    const response = await axios.get(`${API}/pokemon?limit=${limit}&offset=${offset}`);
    const pokemons = await Promise.all(
        response.data.results.map(async (pokemon) => {
            const id = pokemon.url.split("/").slice(-2)[0];
            const image = (await axios.get(`${API}/pokemon/${id}`)).data.sprites.front_default;
            const koreanNameObj = (await axios.get(`${API}/pokemon-species/${id}`)).data.names.find(
                (name) => name.language.name === "ko"
            );
            const koreanName = koreanNameObj ? koreanNameObj.name : "No Korean name";
            return { id, name: koreanName, image };
        })
    );
    return pokemons;
};


// 테스트 코드
export const TestCode = async() => {
    const response = await axios.get(`${API}/language/3`);
    console.log(response.data);
    return response.data;
}