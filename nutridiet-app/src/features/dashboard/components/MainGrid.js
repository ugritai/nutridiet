import * as React from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Copyright from './Copyright';
import UniversalCard from './UniversalCard';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PeopleIcon from '@mui/icons-material/People';
import DateRangeIcon from '@mui/icons-material/DateRange';

export default function MainGrid() {
  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      {/* cards */}
      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        {/* Título */}
      </Typography>
      <Grid container
        spacing={2}
        columns={12}
        sx={{ mb: (theme) => theme.spacing(2) }}
      >

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <UniversalCard
            title="Alimentos"
            description="Colección de alimentos guardados en base de datos."
            icon={<LocalDiningIcon fontSize="large" color="" />}
            buttonColor="primary"
            buttonLink="/alimentos"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <UniversalCard
            title="Recetas"
            description="Colección de recetas guardadas en base de datos."
            icon={<MenuBookIcon fontSize="large" color="" />}
            buttonColor="primary"
            buttonLink="/recetas"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <UniversalCard
            title="Pacientes"
            description="Pacentes asignados"
            icon={<PeopleIcon fontSize="large" color="" />}
            buttonText="Ver pacientes"
            buttonColor="primary"
            buttonLink="/pacientes"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <UniversalCard
            title="Planificación de dietas"
            description="Crear nuevas dieta para asignación."
            icon={<DateRangeIcon fontSize="large" color="" />}
            buttonText="Ver pacientes"
            buttonColor="primary"
            buttonLink="/crear-dieta"
          />
        </Grid>
      </Grid>
      <Copyright sx={{ my: 4 }} />
    </Box>
  );
}
