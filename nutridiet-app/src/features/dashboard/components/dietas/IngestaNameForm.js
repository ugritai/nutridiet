import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Box, Button, FormControl, FormLabel, MenuItem, TextField, Typography } from '@mui/material';
import Dashboard from '../../Dashboard';

const tiposIngesta = ['Desayuno', 'Media mañana', 'Almuerzo', 'Merienda', 'Cena'];

export default function IngestaNameForm() {
  const { pacienteN } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const modoEdicion = location.state?.modo === 'editar';
  const ingestaOriginal = location.state?.ingesta || null;

  const [formData, setFormData] = useState({
    tipo: '',
    nombre: ''
  });

  // Prellenar en modo edición
  useEffect(() => {
    if (modoEdicion && ingestaOriginal) {
      setFormData({
        tipo: ingestaOriginal.tipo || '',
        nombre: ingestaOriginal.nombre || ''
      });
    }
  }, [modoEdicion, ingestaOriginal]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const manejarSiguiente = () => {
    if (!formData.tipo || !formData.nombre) {
      alert('Por favor completa todos los campos');
      return;
    }

    const ruta = modoEdicion
      ? `/planificacion_dieta/${encodeURIComponent(pacienteN)}/editar_ingesta/${encodeURIComponent(formData.nombre)}`
      : `/planificacion_dieta/${encodeURIComponent(pacienteN)}/crear_ingesta/${encodeURIComponent(formData.nombre)}`;

    navigate(ruta, {
      state: {
        modo: modoEdicion ? 'editar' : 'crear',
        tipo: formData.tipo,
        ingesta: {
          ...ingestaOriginal,
          nombre: formData.nombre,
          tipo: formData.tipo
        }
      }
    });
  };

  return (
    <Dashboard>
      <Box sx={{ mx: 'auto', mt: 5 }}>
        <Typography variant="h5" gutterBottom>
          {modoEdicion ? 'Editar Ingesta' : 'Crear nueva Ingesta'}
        </Typography>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <FormLabel>Nombre de la Ingesta</FormLabel>
          <TextField
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            disabled={modoEdicion}
            placeholder="Ej. Ingesta del mediodía"
            required
          />
        </FormControl>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <FormLabel>Tipo de Ingesta</FormLabel>
          <TextField
            select
            name="tipo"
            value={formData.tipo}
            onChange={handleChange}
            required
          >
            {tiposIngesta.map((tipo) => (
              <MenuItem key={tipo} value={tipo}>
                {tipo}
              </MenuItem>
            ))}
          </TextField>
        </FormControl>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button variant="outlined" onClick={() => navigate(`/planificacion_dieta/${encodeURIComponent(pacienteN)}`)}>
            Atrás
          </Button>

          <Button variant="contained" color="primary" onClick={manejarSiguiente}>
            {modoEdicion ? 'Editar Ingesta' : 'Siguiente'}
          </Button>
        </Box>
      </Box>
    </Dashboard>
  );
}
