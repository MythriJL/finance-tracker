import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { colors, GlobalStyle } from "../styles/global";
import { auth, googleProvider, firebaseConfig } from "../firebase/config";
import { signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  width: 100vw;
  background-color: ${colors.lightPurple};
`;

const Card = styled.div`
  background-color: ${colors.white};
  padding: 40px 30px;
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.15);
  text-align: center;
  max-width: 360px;
  width: 90%;
`;

const Title = styled.h1`
  color: ${colors.darkPurple};
  margin-bottom: 24px;
`;

const Button = styled.button`
  background-color: ${colors.orange};
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    background-color: ${colors.darkPurple};
  }
`;

const GoogleIcon = styled.img`
  width: 20px;
  height: 20px;
`;

const Login: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) navigate("/"); // redirect to dashboard
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      console.debug("Login: signInWithPopup resolved; currentUser=", auth.currentUser);
      navigate("/"); // redirect after login
    } catch (err) {
      console.error("Login failed:", err);
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <>
      <GlobalStyle />
      <Container>
        <Card>
          <Title>Welcome</Title>
          <p>Sign in with Google to continue</p>
          <Button onClick={handleGoogleSignIn}>
            <GoogleIcon src="/google-icon.svg" alt="Google" />
            Sign in with Google
          </Button>
          {error && <p style={{ marginTop: 12, color: 'red' }}>{error}</p>}
        </Card>
      </Container>
    </>
  );
};

export default Login;
