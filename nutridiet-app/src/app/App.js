import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import SignInSide from "../features/auth/SignInSide";
import SignUp from "../features/auth/SignUp";

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirigir "/" a "/sign-in" automáticamente */}
        <Route path="/" element={<Navigate to="/sign-in" />} />

        {/* Definir las rutas de autenticación */}
        <Route path="/sign-in" element={<SignInSide />} />
        <Route path="/sign-up" element={<SignUp />} />
      </Routes>
    </Router>
  );
}

export default App;
