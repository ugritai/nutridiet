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
  inicio: 'Inicio',
  alimentos: 'Alimentos',
  detalle_alimento: 'Detalle del alimento',
  categorias: 'Categorías',
  recetas: 'Recetas',
  detalle_receta: 'Detalle de la receta',
  pacientes: 'Pacientes',
  crear_paciente: 'Nuevo paciente',
  planificacion_dieta: 'Planificación de dieta',
  crear_dieta: 'Crear dieta',
  editar_dieta: 'Editar dieta',
  crear_ingesta: 'Crear ingesta',
  editar_ingesta: 'Editar ingesta',
  mi_cuenta: 'Mi cuenta',
  detalle_dieta: 'Detalle de dieta',
  configuracion: 'Configuración',
  acerca_de: 'Acerca de',
  comentarios: 'Comentarios',
};

export default function NavbarBreadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const desdeDieta = location.state?.desdeDieta;
  const dietaNombre = location.state?.dietaNombre;
  const dietaId = location.state?.dietaId;

  return (
    <StyledBreadcrumbs separator={<NavigateNextRoundedIcon fontSize="small" />}>
      {/* Siempre mostramos Inicio */}
      <Link component={RouterLink} underline="hover" color="inherit" to="/inicio">
        Inicio
      </Link>

      {/* Si vienes desde dieta: mostrar dieta y nombre de receta */}
      {pathnames.includes('detalle_receta') && desdeDieta && dietaNombre && dietaId ? (
        [
          <Link
            key="breadcrumb-dieta"
            component={RouterLink}
            underline="hover"
            color="inherit"
            to={`/detalle_dieta/${encodeURIComponent(dietaNombre)}`}
            state={{ dietaId }}
          >
            {dietaNombre}
          </Link>,
          <Typography key="receta-final" color="text.primary" sx={{ fontWeight: 600 }}>
            {decodeURIComponent(pathnames[pathnames.length - 1])
              .split(' ')
              .map(p => p.charAt(0).toUpperCase() + p.slice(1))
              .join(' ')}
          </Typography>
        ]
      ) : (
        // Caso normal: no vienes desde dieta
        pathnames.map((value, index) => {
          if (value === 'inicio') return null;

          const previous = pathnames[index - 1];
          const isLast = index === pathnames.length - 1;

          // Saltar IDs cuando ya están representados
          if (
            ['detalle_dieta', 'detalle_alimento', 'detalle_receta', 'categorias', 'editar_dieta', 'editar_ingesta', 'crear_ingesta'].includes(previous)
          ) {
            return null;
          }

          const to = '/' + pathnames.slice(0, index + 1).join('/');
          const label = pathNameMap[value] || decodeURIComponent(value);

          return isLast ? (
            <Typography key={to} color="text.primary" sx={{ fontWeight: 600 }}>
              {label}
            </Typography>
          ) : (
            <Link key={to} component={RouterLink} underline="hover" color="inherit" to={to}>
              {label}
            </Link>
          );
        })
      )}
    </StyledBreadcrumbs>
  );
}
