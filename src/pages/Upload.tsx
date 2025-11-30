// src/pages/Upload.tsx
import React from "react";
import styled from "styled-components";
import Sidebar from "../components/Sidebar";
// Updated import to point to the correct file name in components
import UploadBankStatement from "../components/UploadBankStatement"; 
import { colors, GlobalStyle } from "../styles/global";

const Container = styled.div`
  display: flex;
  min-height: 100vh;
`;

const Main = styled.main`
  flex: 1;
  padding: 20px;
  background-color: ${colors.lightPurple};
`;

const UploadPage: React.FC = () => {
  return (
    <>
      <GlobalStyle />
      <Container>
        <Sidebar />
        <Main>
          <UploadBankStatement />
        </Main>
      </Container>
    </>
  );
};

export default UploadPage;