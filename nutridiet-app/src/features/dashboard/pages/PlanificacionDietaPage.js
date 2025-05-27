import React from 'react';
import Dashboard from '../Dashboard';
import SeleccionPacientePage from '../components/dietas/SeleccionPacientePage';

export default function PlanificacionDietasPage() {

  return (
    <Dashboard>
      <SeleccionPacientePage/>
    </Dashboard>
  );
}
