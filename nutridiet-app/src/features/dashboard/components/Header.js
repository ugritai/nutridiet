import * as React from 'react';
import Stack from '@mui/material/Stack';
import NavbarBreadcrumbs from './NavbarBreadcrumbs';
import ColorModeIconDropdown from '../../../assets/shared-theme/customizations/ColorModeIconDropdown';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import OptionsMenu from './OptionsMenu';


export default function Header() {
  // Obtener datos del localStorage
  const userEmail = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');
  const userName = localStorage.getItem('userName') || sessionStorage.getItem('userName');

  return (
    <Stack
      direction="row"
      sx={{
        display: { xs: 'none', md: 'flex' },
        width: '100%',
        alignItems: { xs: 'flex-start', md: 'center' },
        justifyContent: 'space-between',
        maxWidth: { sm: '100%', md: '1700px' },
        pt: 1.5,
      }}
      spacing={2}
    >
      <NavbarBreadcrumbs />
      <Stack direction="row" spacing={2} alignItems="center">
        {/* Perfil del usuario */}
        <Stack
          direction="row"
          sx={{
            gap: 1,
            alignItems: 'center',
            borderRight: '1px solid',
            borderColor: 'divider',
            pr: 2,
          }}
        >
          <Avatar
            sizes="small"
            alt={userName}
            sx={{ width: 36, height: 36 }}
          />
          <Box sx={{ mr: 'auto' }}>
            <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: '16px' }}>
              {userName}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {userEmail}
            </Typography>
          </Box>
          <OptionsMenu />
        </Stack>

        {/* Tema */}
        <ColorModeIconDropdown />
      </Stack>
    </Stack>
  );
}
