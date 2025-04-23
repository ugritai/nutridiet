// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import SignInSide from "../features/auth/SignInSide";
import SignUp from "../features/auth/SignUp";
import InicioPage from "../features/dashboard/pages/InicioPage"
import BusquedaRecetas from '../features/dashboard/pages/BusquedaRecetas';
import ProtectedRoute from '../features/auth/ProtectedRoute';
import Alimentos from '../features/dashboard/pages/AlimentosPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/sign-in" />} />
        <Route path="/sign-in" element={<SignInSide />} />
        <Route path="/sign-up" element={<SignUp />} />

        {/* Rutas protegidas*/}
        <Route path="/inicio" element={
          <ProtectedRoute>
            < InicioPage/>
          </ProtectedRoute>}
        />

        <Route path="/busqueda-recetas" element={
          <ProtectedRoute>
            <BusquedaRecetas />
          </ProtectedRoute>}
        />

        <Route path="/alimentos" element={
          <ProtectedRoute>
            <Alimentos />
          </ProtectedRoute>}
        />
      </Routes>
    </Router>
  );
}

export default App;

