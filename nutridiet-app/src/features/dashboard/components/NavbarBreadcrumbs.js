import React from 'react';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Breadcrumbs, { breadcrumbsClasses } from '@mui/material/Breadcrumbs';
import NavigateNextRoundedIcon from '@mui/icons-material/NavigateNextRounded';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import Link from '@mui/material/Link';

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

const pathNameMap = {
  'inicio': 'Inicio',
  'alimentos': 'Alimentos',
  'detalle_alimento': '',
  'recetas': 'Recetas',
  'busqueda-recetas': 'Búsqueda de Recetas',
  'pacientes': 'Pacientes',
  'planificacion_dieta': 'Planificación de dieta',
  'categorias': 'Categorías',
  'crear_ingesta': 'Crear ingesta',
  'crear_dieta': 'Crear dieta',
  'mi_cuenta': 'Mi Cuenta',
  'editar_ingesta': 'Editar ingesta'
};

export default function NavbarBreadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const dietaNombre = sessionStorage.getItem('breadcrumb_dieta_nombre');
  const dietaId = sessionStorage.getItem('breadcrumb_dieta_id');

  return (
    <StyledBreadcrumbs
      aria-label="breadcrumb"
      separator={<NavigateNextRoundedIcon fontSize="small" />}
    >
      {/* Siempre mostramos Inicio */}
      <Link
        component={RouterLink}
        underline="hover"
        color="inherit"
        to="/inicio"
      >
        Inicio
      </Link>

      {/* Si estamos en /recetas/:nombre y hay dieta guardada, insertamos antes de la receta */}
      {pathnames.includes('recetas') && dietaNombre && dietaId && (
        <Link
          key="breadcrumb-dieta"
          component={RouterLink}
          underline="hover"
          color="inherit"
          to={`/detalle_dieta/${encodeURIComponent(dietaNombre)}`}
          state={{ dietaId }}
        >
          {dietaNombre}
        </Link>
      )}

      {/* Map normal del resto de path */}
      {pathnames.includes('detalle_receta') && dietaNombre && dietaId ? (
        <>
          <Link
            key="breadcrumb-dieta"
            component={RouterLink}
            underline="hover"
            color="inherit"
            to={`/detalle_dieta/${encodeURIComponent(dietaNombre)}`}
            state={{ dietaId }}
          >
            {dietaNombre}
          </Link>
          <Typography color="text.primary" sx={{ fontWeight: 600 }}>
            {decodeURIComponent(pathnames[pathnames.length - 1])}
          </Typography>
        </>
      ) : (
        pathnames.map((value, index) => {
          if (value === 'inicio') return null;

          // ❌ Salta 'detalle_dieta' y su valor siguiente si ya estamos mostrando manualmente
          if (
            pathnames.includes('detalle_receta') &&
            (value === 'detalle_dieta' || pathnames[index - 1] === 'detalle_dieta')
          ) {
            return null;
          }

          const to = '/' + pathnames.slice(0, index + 1).join('/');
          const isLast = index === pathnames.length - 1;
          let label = pathNameMap[value] || decodeURIComponent(value);

          if (
            ['detalle_alimento', 'detalle_receta', 'detalle_dieta', 'categorias', 'editar_dieta'].includes(pathnames[index - 1])
          ) {
            label = decodeURIComponent(value);
          }

          return isLast ? (
            <Typography key={to} color="text.primary" sx={{ fontWeight: 600 }}>
              {label}
            </Typography>
          ) : (
            <Link
              key={to}
              component={RouterLink}
              underline="hover"
              color="inherit"
              to={to}
            >
              {label}
            </Link>
          );
        })
      )}

    </StyledBreadcrumbs>
  );
}
