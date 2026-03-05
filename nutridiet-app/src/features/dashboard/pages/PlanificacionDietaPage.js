// src/pages/PlanificacionDietaPage.js
import React from 'react';
import Dashboard from '../Dashboard';
import SeleccionPacientePage from '../components/dietas/SeleccionPacientePage';

/**
 * Punto de entrada para el módulo de planificación de dietas.
 */
export default function PlanificacionDietasPage() {
    return (
        <Dashboard>
            <SeleccionPacientePage />
        </Dashboard>
    );
}