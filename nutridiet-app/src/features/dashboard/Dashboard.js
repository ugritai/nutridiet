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
import { fetchWithAuth } from '../../api'; 

export default function Dashboard({ children, ...props }) {
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const fetchProtectedData = async () => {
      try {
        const response = await fetchWithAuth('/auth/me'); 
        if (response.ok) {
          const data = await response.json();
          setUserInfo(data); 
          console.log('🔐 Token válido. Usuario:', data);
        } else {
          console.warn('⛔ No autorizado');
        }
      } catch (error) {
        console.error('❌ Error al obtener datos protegidos:', error);
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
