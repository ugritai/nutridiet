import * as React from 'react';
import Stack from '@mui/material/Stack';
import NavbarBreadcrumbs from './NavbarBreadcrumbs';
import ColorModeIconDropdown from '../../../assets/shared-theme/customizations/ColorModeIconDropdown';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import OptionsMenu from './PerfilOptionsMenu';
import Divider from '@mui/material/Divider';

function stringToColor(string) {
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  return color;
}

function stringAvatar(name) {
  const nameParts = name?.split(' ') || [];
  const initials = nameParts.length >= 2
    ? `${nameParts[0][0]?.toUpperCase() || ''}${nameParts[1][0]?.toUpperCase() || ''}`
    : nameParts[0]?.[0]?.toUpperCase() || '?';
  return {
    sx: {
      bgcolor: stringToColor(name || 'User'),
    },
    children: initials,
  };
}

export default function Header() {
  const userEmail = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');
  const userName = localStorage.getItem('userName') || sessionStorage.getItem('userName');

  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={2}
      sx={{
        width: '100%',
        alignItems: 'stretch',
        justifyContent: 'space-between',
        maxWidth: { sm: '100%', md: '1700px' },
        pt: 2,
        px: { xs: 2, md: 3 },
      }}
    >
      <NavbarBreadcrumbs />

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="flex-end"
        sx={{ mt: { xs: 2, md: 0 } }}
      >
        {/* Perfil */}
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          divider={<Divider orientation="vertical" flexItem />}
        >
          <Avatar {...stringAvatar(userName)} alt={userName} />

          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {userName}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {userEmail}
            </Typography>
          </Box>

          <OptionsMenu />
        </Stack>

        {/* Switch de tema */}
        <ColorModeIconDropdown />
      </Stack>
    </Stack>
  );
}
