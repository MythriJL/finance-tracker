import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Upload from "./pages/Upload";
import Login from "./pages/Login";
import PrivateRoute from "./components/PrivateRoute";
import Home from "./pages/Home";
import TransactionsPage from "./pages/Transactions"; // <-- NEW IMPORT

const App: React.FC = () => (
  <Router>
    <Routes>
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        }
      />
      <Route
        path="/upload"
        element={
          <PrivateRoute>
            <Upload />
          </PrivateRoute>
        }
      />
      {/* NEW ROUTE FOR TRANSACTIONS/CHIT FUNDS PAGE */}
      <Route
        path="/transactions"
        element={
          <PrivateRoute>
            <TransactionsPage />
          </PrivateRoute>
        }
      />
      <Route path="/login" element={<Login />} />
    </Routes>
  </Router>
);

export default App;