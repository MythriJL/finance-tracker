// src/pages/Upload.tsx
import React from "react";
import styled from "styled-components";
import Sidebar from "../components/Sidebar";
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

const SectionTitle = styled.h2`
  color: ${colors.darkPurple};
  margin-bottom: 20px;
`;

const UploadPage: React.FC = () => {
  return (
    <>
      <GlobalStyle />
      <Container>
        <Sidebar />
        <Main>
          <SectionTitle>Upload Bank Statement</SectionTitle>
          <UploadBankStatement />
        </Main>
      </Container>
    </>
  );
};

export default UploadPage;
