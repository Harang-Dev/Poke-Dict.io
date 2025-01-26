import React from "react";
import styled from "styled-components";
import { TestCode } from "../API/api";

const TitleBox = styled.div`
    width: auto;
    font-size: 5em;
    font-weight: bold;
    text-align: center;
    color: #004076;
`;

function Title () {
    return (
        <TitleBox onClick={TestCode}>POKE-DICT</TitleBox>
    );
};

export default Title;