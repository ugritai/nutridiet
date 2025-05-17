import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import Dashboard from '../Dashboard';
import CrearDietaCard from '../components/dietas/CrearDietaCard';
import CrearIngestaCard from '../components/dietas/CrearIngestaCard';

export default function PlanificacionDietasPage() {
  const navigate = useNavigate();

  return (
    <Dashboard>

      <Typography variant="h4">
        Planificación de Dieta
      </Typography>
      <Box sx={{ width: '100%', display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>

        <CrearDietaCard onClick={() => navigate('/planificacion_dieta/crear_dieta')} />
        <CrearIngestaCard onClick={() => navigate('/planificacion_dieta/crear_ingesta')} />
      </Box>
    </Dashboard>
  );
}
