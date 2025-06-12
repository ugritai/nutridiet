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
  const orden =
    JSON.parse(localStorage.getItem("ordenTarjetas")) || [
      "alimentos",
      "recetas",
      "pacientes",
      "dietas",
    ];

  const tarjetas = {
    alimentos: {
      title: "Alimentos",
      description: "Colección de alimentos guardados en base de datos.",
      icon: <LocalDiningIcon fontSize="large" />,
      link: "/alimentos",
    },
    recetas: {
      title: "Recetas",
      description: "Colección de recetas guardadas en base de datos.",
      icon: <MenuBookIcon fontSize="large" />,
      link: "/recetas",
    },
    pacientes: {
      title: "Pacientes",
      description: "Pacientes asignados",
      icon: <PeopleIcon fontSize="large" />,
      link: "/pacientes",
    },
    dietas: {
      title: "Planificación de dietas",
      description: "Crear nuevas dietas para asignación.",
      icon: <DateRangeIcon fontSize="large" />,
      link: "/planificacion_dieta",
    },
  };

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        Inicio
      </Typography>

      <Grid container spacing={2} columns={12} sx={{ mb: 2 }}>
        {orden.map((key) => {
          const card = tarjetas[key];
          return (
            <Grid size={{ xs: 12, sm: 6, lg: 6, md: 6 }} key={key}>
              <UniversalCard
                title={card.title}
                description={card.description}
                icon={card.icon}
                buttonColor="primary"
                buttonLink={card.link}
                buttonText={`Ver ${card.title.toLowerCase()}`}
              />
            </Grid>
          );
        })}
      </Grid>

      <Copyright sx={{ my: 4 }} />
    </Box>
  );
}
