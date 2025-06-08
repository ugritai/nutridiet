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

  return (
    <StyledBreadcrumbs
      aria-label="breadcrumb"
      separator={<NavigateNextRoundedIcon fontSize="small" />}
    >
      {/* 始终显示 Inicio，链接到主页 */}
      <Link
        component={RouterLink}
        underline="hover"
        color="inherit"
        to="/inicio"
      >
        Inicio
      </Link>

      {pathnames.map((value, index) => {
        // 跳过 'inicio'，因为我们已经手动加了
        if (value === 'inicio') return null;

        const to = '/' + pathnames.slice(0, index + 1).join('/');
        const isLast = index === pathnames.length - 1;
        let label = pathNameMap[value] || decodeURIComponent(value);

        // 处理 detalle_alimento/:nombre
        if (pathnames.includes('detalle_alimento')) {
          if (value === 'detalle_alimento') return null;
          if (pathnames[index - 1] === 'detalle_alimento') {
            label = decodeURIComponent(value);
          }
        }

        if (pathnames.includes('detalle_receta')) {
          if (value === 'detalle_receta') return null;
          if (pathnames[index - 1] === 'detalle_receta') {
            label = decodeURIComponent(value);
          }
        }

        // 处理 categorias/:nombre
        if (pathnames.includes('categorias')) {
          if (value === 'categorias') return null;
          if (pathnames[index - 1] === 'categorias') {
            label = decodeURIComponent(value);
          }
        }

        // 处理 categorias/:nombre
        if (pathnames.includes('editar_dieta')) {
          if (value === 'editar_dieta') return null;
          if (pathnames[index - 1] === 'editar_dieta') {
            label = decodeURIComponent(value);
          }
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
      })}
    </StyledBreadcrumbs>
  );
}
