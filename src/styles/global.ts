// src/styles/global.ts
import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
  body {
    height: 100%;
    margin: 0;
    padding: 0;
    font-family: 'Arial', sans-serif;
    background-color: #F7F4F7;
    color: #120216;
  }

  a {
    text-decoration: none;
    color: inherit;
  }

  button {
    cursor: pointer;
  }
`;

export const colors = {
  white: "#FFFFFF",
  purple: "#8F659A",
  orange: "#EF8767",
  darkPurple: "#42224A",
  lightPurple: "#F7F4F7",
  black: "#120216",
};
