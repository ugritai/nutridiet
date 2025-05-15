import * as React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import SearchIcon from '@mui/icons-material/Search';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import HelpRoundedIcon from '@mui/icons-material/HelpRounded';
import DateRangeIcon from '@mui/icons-material/DateRange';
import { useNavigate } from 'react-router-dom';


export default function MenuContent() {
  const navigate = useNavigate();

  const mainListItems = [
    { text: 'Inicio', icon: <HomeRoundedIcon />, path: '/inicio' },
    { text: 'Pacientes', icon: <PeopleRoundedIcon />, path: '/pacientes' },
    { text: 'Búsqueda de Alimentos', icon: <SearchIcon />, path: '/alimentos' },
    { text: 'Búsqueda de Recetas', icon: <SearchIcon />, path: '/recetas' },
    { text: 'Crear Dieta', icon: <DateRangeIcon />, path: '/planificacion_dietas' }
  ];

  const secondaryListItems = [
    { text: 'Configuración', icon: <SettingsRoundedIcon />, path: '/configuracion' },
    { text: 'Acerca de', icon: <InfoRoundedIcon />, path: '/acerce' },
    { text: 'Comentarios', icon: <HelpRoundedIcon />, parh: '/comentarios' },
  ];

  const handleNavigate = (path) => () => {
    navigate(path);
  };

  return (
    <Stack sx={{ flexGrow: 1, p: 1, justifyContent: 'space-between' }}>
      <List dense>
        {mainListItems.map((item, index) => (
          <ListItem key={index} disablePadding sx={{ display: 'block' }}>
            <ListItemButton onClick={handleNavigate(item.path)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <List dense>
        {secondaryListItems.map((item, index) => (
          <ListItem key={index} disablePadding sx={{ display: 'block' }}>
            <ListItemButton onClick={handleNavigate(item.path)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Stack>
  );
}
