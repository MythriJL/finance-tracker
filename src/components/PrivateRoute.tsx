// src/components/PrivateRoute.tsx
import React from "react";
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { auth } from "../firebase/config";
import { onAuthStateChanged } from "firebase/auth";

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
  console.log("PrivateRoute mounted. Auth object:", auth);

  const unsubscribe = onAuthStateChanged(auth, (user) => {
    console.log("AUTH STATE CHANGED ---->", user);
    setLoggedIn(!!user);
    setLoading(false);
  });

  return () => unsubscribe();
}, []);


  if (loading) return <div>Loading...</div>;

  return loggedIn ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
