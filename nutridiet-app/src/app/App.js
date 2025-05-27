// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import SignInSide from "../features/auth/SignInSide";
import SignUp from "../features/auth/SignUp";
import InicioPage from "../features/dashboard/pages/InicioPage";
import ProtectedRoute from '../features/auth/ProtectedRoute';
import Alimentos from '../features/dashboard/pages/AlimentosPage';
import DetalleAlimentoPage from '../features/dashboard/pages/DetalleAlimentoPage';
import AlimentosPorCategoriaPage from '../features/dashboard/pages/AlimentosPorCategoriaPage';
import Recetas from '../features/dashboard/pages/RecetasPage';
import DetalleRecetasPage from '../features/dashboard/pages/DetalleRecetasPage';
import RecetasPorCategoriaPage from '../features/dashboard/pages/RecetasPorCategoriaPage';
import PacientesPage from '../features/dashboard/pages/PacientesPage';
import PlanificacionDietaPage from '../features/dashboard/pages/PlanificacionDietaPage';
import SeleccionPacientePage from '../features/dashboard/components/dietas/SeleccionPacientePage';
import CrearIngestaForm from '../features/dashboard/components/dietas/CrearIngestaForm';
import CrearDietaForm from '../features/dashboard/components/dietas/CrearDietaForm';
import PerfilPage from '../features/dashboard/pages/PerfilPage';
import DietaIngePacienteCard from "../features/dashboard/components/dietas/DietaIngePacienteCard";
import IngestaNameForm from "../features/dashboard/components/dietas/IngestaNameForm";

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
            < InicioPage />
          </ProtectedRoute>}
        />

        <Route path="/alimentos" element={
          <ProtectedRoute>
            <Alimentos />
          </ProtectedRoute>}
        />

        <Route path="/alimentos/detalle_alimento/:nombre" element={
          <ProtectedRoute>
            <DetalleAlimentoPage />
          </ProtectedRoute>}
        />

        <Route path="/alimentos/categorias/:categoria" element={
          <ProtectedRoute>
            <AlimentosPorCategoriaPage />
          </ProtectedRoute>

        } />

        <Route path="/recetas" element={
          <ProtectedRoute>
            <Recetas />
          </ProtectedRoute>

        } />

        <Route path="/recetas/categorias/:categoria" element={
          <ProtectedRoute>
            <RecetasPorCategoriaPage />
          </ProtectedRoute>

        } />

        <Route path="/recetas/detalle_receta/:nombre" element={
          <ProtectedRoute>
            <DetalleRecetasPage />
          </ProtectedRoute>}
        />

        <Route path="/pacientes" element={
          <ProtectedRoute>
            <PacientesPage />
          </ProtectedRoute>

        } />

        <Route path="/paciente/crear_paciente" element={
          <ProtectedRoute>
            <PacientesPage />
          </ProtectedRoute>
        } />

        <Route path="/planificacion_dieta" element={
          <ProtectedRoute>
            <PlanificacionDietaPage />
          </ProtectedRoute>

        } />

        <Route path="/planificacion_dieta/:pacienteN" element={
          <ProtectedRoute>
            <DietaIngePacienteCard />
          </ProtectedRoute>

        } />

        <Route path="/planificacion_dieta/crear_dieta" element={
          <ProtectedRoute>
            <SeleccionPacientePage tipo="dieta" />
          </ProtectedRoute>
        } />

        <Route path="/planificacion_dieta/crear_ingesta" element={
          <ProtectedRoute>
            <SeleccionPacientePage tipo="ingesta" />
          </ProtectedRoute>
        } />

        <Route path="/planificacion_dieta/:pacienteN/crear_ingesta" element={
          <ProtectedRoute>
            < IngestaNameForm />
          </ProtectedRoute>
        } />

        <Route path="/planificacion_dieta/:pacienteN/crear_ingesta/:nombreIngesta" element={
          <ProtectedRoute>
            < CrearIngestaForm />
          </ProtectedRoute>
        } />

        <Route path="/planificacion_dieta/:pacienteN/crear_dieta/" element={
          <ProtectedRoute>
            <CrearDietaForm />
          </ProtectedRoute>
        } />

        <Route path="/mi_cuenta" element={
          <ProtectedRoute>
            <PerfilPage />
          </ProtectedRoute>
        } />

      </Routes>
    </Router>
  );
}

export default App;

