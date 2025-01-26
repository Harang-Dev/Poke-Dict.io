import React from "react";
import styled from "styled-components";

const CardContainer = styled.div`
    width: 224px;
    height: 336px;
    border: 10px solid #004076;
    border-radius: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;

    @media all and (max-width: 479px) {
        /* 모바일에서도 크기와 레이아웃을 그대로 유지 */
        width: 224px;
        height: 336px;
    }
`;

const ImageContainer = styled.div`
    width: 208px;
    height: 256px;
    background-image: url(${(props) => props.imageUrl});
    background-size: cover;
    background-position: center;

    @media all and (max-width: 479px) {
        /* 모바일에서도 이미지 크기 유지 */
        width: 208px;
        height: 256px;
    }
`;

const NameContainer = styled.div`
    width: 100%;
    height: 81px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #fff;
    font-size: 20px;
    font-weight: bold;
    background-color: #004076;

    @media all and (max-width: 479px) {
        /* 모바일에서도 이름 부분 크기 유지 */
        height: 81px;
    }
`;

const PokeCard = ({ image, name }) => {
    return (
        <CardContainer>
            <ImageContainer imageUrl={image} />
            <NameContainer>{name}</NameContainer>
        </CardContainer>
    );
};

export default PokeCard;
