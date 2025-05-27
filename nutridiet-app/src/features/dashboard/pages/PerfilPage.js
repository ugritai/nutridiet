import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import Dashboard from '../Dashboard';
import { fetchWithAuth } from '../components/api';

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  [theme.breakpoints.up('sm')]: {
    width: '450px',
  },
  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));

export default function PerfilPage(props) {
  const [formValues, setFormValues] = React.useState({
    name: '',
    email: '',
    phone: '',
    language: 'Spanish',
    oldPassword: '',
    newPassword: '',
  });

  const [errors, setErrors] = React.useState({});

  React.useEffect(() => {
    const fetchNutricionistaInfo = async () => {
      try {
        const response = await fetchWithAuth('/nutricionistas/nutricionista_info');

        if (response.ok) {
          const data = await response.json();
          setFormValues((prev) => ({
            ...prev,
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            language: data.idioma || 'Spanish',
          }));
        } else {
          console.error('No se pudo cargar la información del nutricionista');
        }
      } catch (error) {
        console.error('Error al obtener información del perfil:', error);
      }
    };

    fetchNutricionistaInfo();
  }, []);


  const handleChange = (e) => {
    setFormValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validateInputs = () => {
    const newErrors = {};
    if (!formValues.name) newErrors.name = 'El nombre es obligatorio.';
    if (!/\S+@\S+\.\S+/.test(formValues.email)) newErrors.email = 'Correo inválido.';
    if (!/^[0-9]{9}$/.test(formValues.phone)) newErrors.phone = 'Teléfono inválido (9 dígitos).';
    if (!formValues.language) newErrors.language = 'Seleccione un idioma.';

    // Validar contraseña si se quiere cambiar
    if (formValues.oldPassword || formValues.newPassword) {
      if (!formValues.oldPassword) newErrors.oldPassword = 'Debe ingresar la contraseña antigua para cambiarla.';
      if (!formValues.newPassword) newErrors.newPassword = 'Debe ingresar la nueva contraseña.';
      if (formValues.newPassword && formValues.newPassword.length < 6) {
        newErrors.newPassword = 'La nueva contraseña debe tener al menos 6 caracteres.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateInputs()) return;

    try {
      const token = localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');

      const bodyData = {
        name: formValues.name,
        phone: formValues.phone,
        language: formValues.language,
      };

      // Solo enviar passwords si quiere cambiar
      if (formValues.oldPassword && formValues.newPassword) {
        bodyData.old_password = formValues.oldPassword;
        bodyData.new_password = formValues.newPassword;
      }

      const response = await fetch('http://localhost:8000/nutricionistas/actualizar_nutricionista', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyData),
      });

      if (response.ok) {
        alert('Perfil actualizado correctamente');
        // Opcional: limpiar passwords
        setFormValues((prev) => ({ ...prev, oldPassword: '', newPassword: '' }));
      } else {
        const errorData = await response.json();
        alert(errorData.detail || 'Error al actualizar perfil');
      }
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      alert('Error de conexión');
    }
  };

  return (
    <Dashboard>
      <CssBaseline enableColorScheme />
      <Card variant="outlined">
        <Typography component="h1" variant="h4">
          Mi perfil
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl>
            <FormLabel htmlFor="name">Nombre</FormLabel>
            <TextField
              id="name"
              name="name"
              fullWidth
              required
              value={formValues.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
            />
          </FormControl>
          <FormControl>
            <FormLabel htmlFor="email">Correo</FormLabel>
            <TextField
              id="email"
              name="email"
              fullWidth
              disabled
              value={formValues.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
            />
          </FormControl>
          <FormControl>
            <FormLabel htmlFor="phone">Teléfono</FormLabel>
            <TextField
              id="phone"
              name="phone"
              fullWidth
              required
              value={formValues.phone}
              onChange={handleChange}
              error={!!errors.phone}
              helperText={errors.phone}
            />
          </FormControl>
          <FormControl>
            <FormLabel htmlFor="language">Idioma</FormLabel>
            <TextField
              id="language"
              name="language"
              select
              fullWidth
              required
              value={formValues.language}
              onChange={handleChange}
              error={!!errors.language}
              helperText={errors.language}
            >
              <MenuItem value="Spanish">Español</MenuItem>
              <MenuItem value="English">Inglés</MenuItem>
            </TextField>
          </FormControl>

          {/* Contraseña antigua */}
          <FormControl>
            <FormLabel htmlFor="oldPassword">Contraseña antigua</FormLabel>
            <TextField
              id="oldPassword"
              name="oldPassword"
              type="password"
              fullWidth
              value={formValues.oldPassword}
              onChange={handleChange}
              error={!!errors.oldPassword}
              helperText={errors.oldPassword}
              placeholder="••••••"
            />
          </FormControl>

          {/* Nueva contraseña */}
          <FormControl>
            <FormLabel htmlFor="newPassword">Nueva contraseña</FormLabel>
            <TextField
              id="newPassword"
              name="newPassword"
              type="password"
              fullWidth
              value={formValues.newPassword}
              onChange={handleChange}
              error={!!errors.newPassword}
              helperText={errors.newPassword}
              placeholder="••••••"
            />
          </FormControl>

          <Button type="submit" fullWidth variant="contained">
            Guardar cambios
          </Button>
        </Box>
      </Card>
    </Dashboard>
  );
}
