import * as React from 'react';
import { useEffect, useState } from 'react';
import { alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Header from './components/Header';
import UserMenu from './components/SideMenu';
import AppTheme from '../../assets/shared-theme/AppTheme';
import AuthHandler from '../auth/AuthHandler';
import { fetchWithAuth } from './components/api'; 

/**
 * Componente Layout principal (HOC - Higher Order Component).
 * Envuelve las vistas protegidas proporcionando la estructura base de la UI
 * (menú lateral, cabecera y tema) y valida silenciosamente la sesión del usuario al montar.
 * * @param {Object} props.children - El contenido dinámico de la vista actual.
 */
export default function Dashboard({ children, ...props }) {
  const [userInfo, setUserInfo] = useState(null);

  // Validación de sesión on-mount. 
  // Nota para desarrollo: Actualmente solo guarda el userInfo en estado local, 
  // considerar moverlo a un Contexto global si más componentes necesitan estos datos.
  useEffect(() => {
    const fetchProtectedData = async () => {
      try {
        const response = await fetchWithAuth('/auth/me'); 
        if (response.ok) {
          const data = await response.json();
          setUserInfo(data); 
          console.debug('[Dashboard] Token válido. Datos de usuario cargados.');
        } else {
          console.warn('[Dashboard] Sesión no autorizada o expirada.');
        }
      } catch (error) {
        console.error('[Dashboard] Error de red al validar sesión:', error);
      }
    };

    fetchProtectedData();
  }, []);

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <Box sx={{ display: 'flex' }}>
        <AuthHandler />
        <UserMenu />
        
        {/* Contenedor principal del contenido */}
        <Box
          component="main"
          sx={(theme) => ({
            flexGrow: 1,
            backgroundColor: theme.vars
              ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
              : alpha(theme.palette.background.default, 1),
            overflow: 'auto',
          })}
        >
          <Stack
            spacing={2}
            sx={{
              alignItems: 'center',
              mx: 3,
              pb: 5,
              mt: { xs: 8, md: 0 },
            }}
          >
            <Header />
            {children} 
          </Stack>
        </Box>
      </Box>
    </AppTheme>
  );
}