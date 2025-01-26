import React, { useEffect } from "react";
import styled from "styled-components";
import { useGetPokemons } from "../Hooks/useGetPokemons";
import { useInView } from "react-intersection-observer";
import PokeCard from "./PokeCard";

const CardGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    justify-items: center;

    @media all and (max-width:479px) {
        grid-template-columns: repeat(3, 1fr);
    }
`;

function PokeCardList() {
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useGetPokemons();

    const { ref, inView } = useInView();

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            setTimeout(() => {fetchNextPage()}, 2000);
        }
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

    return (
        <>
            <CardGrid>
                {data?.pages.flatMap((page) =>
                    page.map((pokemon) => (
                        <PokeCard key={pokemon.id} image={pokemon.image} name={pokemon.name} />
                    ))
                )}
            </CardGrid>
            <h1 ref={ref}>
            </h1>
        </>
    );
}

export default PokeCardList;
