import React from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard from '../Dashboard';
import CrearRecetaForm from '../components/CrearRecetaForm'; 
import { Box, Typography, Button, Container, Grid } from '@mui/material';
import { ArrowBack, RestaurantMenu } from '@mui/icons-material';

export default function CrearRecetaPage() {
  const navigate = useNavigate();

  const handleRecetaCreada = (data) => {
    navigate('/recetas'); 
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <Dashboard>
      {/* Contenedor con ancho máximo para que no se desparrame en monitores ultra-wide */}
      <Container maxWidth="xl">
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button 
              startIcon={<ArrowBack />} 
              onClick={handleCancel}
              variant="text"
              color="inherit"
            >
              Volver
            </Button>
            <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: 1 }}>
                   <RestaurantMenu color="primary" /> Nueva Receta
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Configura los detalles nutricionales y pasos de tu nueva creación profesional.
                </Typography>
            </Box>
          </Box>
        </Box>

        {/* Aquí es donde ocurre la magia. 
           Envolvemos el formulario. Si tu CrearRecetaForm usa un <Grid container> interno, 
           ocupará todo el espacio disponible de forma mucho más armónica.
        */}
        <Box sx={{ width: '100%' }}>
            <CrearRecetaForm 
                onSuccess={handleRecetaCreada} 
                onCancel={handleCancel}
            />
        </Box>
      </Container>
    </Dashboard>
  );
}