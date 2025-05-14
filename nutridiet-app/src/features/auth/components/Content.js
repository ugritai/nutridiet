import * as React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';
import RestaurantMenuRoundedIcon from '@mui/icons-material/RestaurantMenuRounded';    
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';  
import Logo from '../../../assets/shared-theme/logo'

const items = [
  {
    icon: <RestaurantMenuRoundedIcon sx={{ color: 'text.secondary' }} />,
    title: 'Creación de dietas saludable',
    description:
      'Personaliza planes alimenticios de forma clara sugún tus objetivos y necesidad nutricional.',
  },
  {
    icon: <SearchRoundedIcon sx={{ color: 'text.secondary' }} />,
    title: 'Búsqueda de recetas',
    description:
      'Explora recetas saludables adaptadas a tus preferencias, ingredientes y requerimientos calóricos.',
  },
  {
    icon: <SearchRoundedIcon sx={{ color: 'text.secondary' }} />,
    title: 'Búsqueda de alimentos',
    description:
      'Encuentra alimentos y conoce su valor nutricional detallado para tomar decisiones informadas.',
  },
  {
    icon: <AutoFixHighRoundedIcon sx={{ color: 'text.secondary' }} />,
    title: 'Funcionalidad innovadora',
    description:
      'Disfruta de herramientas inteligentes que facilitan tu planificación alimentaria día a día.',
  },
];

export default function Content() {
  return (
    <Stack
      sx={{ flexDirection: 'column', alignSelf: 'center', gap: 4, maxWidth: 450 }}
    >
      <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mt: 'calc(var(--template-frame-height, 0px) + 4px)',
            p: 1.5,
          }}
        >
        {/* Logo de la aplicación*/}
        <Logo
          style={{
            width: '40px',
            height: '40px',
            objectFit: 'contain',
            marginRight: '10px',
          }}
        />

        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            fontFamily: 'Poppins, sans-serif',
            color: 'green',
          }}
        >
          NutriDiet
        </Typography>
      </Box>
      {items.map((item, index) => (
        <Stack key={index} direction="row" sx={{ gap: 2 }}>
          {item.icon}
          <div>
            <Typography gutterBottom sx={{ fontWeight: 'medium' }}>
              {item.title}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {item.description}
            </Typography>
          </div>
        </Stack>
      ))}
    </Stack>
  );
}