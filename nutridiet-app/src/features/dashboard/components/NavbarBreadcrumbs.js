import * as React from 'react';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Breadcrumbs, { breadcrumbsClasses } from '@mui/material/Breadcrumbs';
import NavigateNextRoundedIcon from '@mui/icons-material/NavigateNextRounded';
import { useLocation } from 'react-router-dom';


const StyledBreadcrumbs = styled(Breadcrumbs)(({ theme }) => ({
  margin: theme.spacing(1, 0),
  [`& .${breadcrumbsClasses.separator}`]: {
    color: (theme.vars || theme).palette.action.disabled,
    margin: 1,
  },
  [`& .${breadcrumbsClasses.ol}`]: {
    alignItems: 'center',
  },
}));

export default function NavbarBreadcrumbs() {
  const location = useLocation(); // Obtener la ruta actual

  // Determinar el nombre de la página dependiendo de la ruta actual
  let breadcrumbText = 'Inicio';
  if (location.pathname === '/busqueda-recetas') {
    breadcrumbText = 'Búsqueda de Recetas';
  } else if (location.pathname === '/pacientes') {
    breadcrumbText = 'Pacientes';
  }

  return (
    <StyledBreadcrumbs
      aria-label="breadcrumb"
      separator={<NavigateNextRoundedIcon fontSize="small" />}
    >
      <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 600 }}>
        {breadcrumbText}
      </Typography>
    </StyledBreadcrumbs>
  );
}
