import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Box, Button, FormControl, FormLabel, MenuItem, TextField, Typography } from '@mui/material';
import Dashboard from '../../Dashboard';

const tiposIngesta = ['3 comidas', '5 comidas'];

export default function IngestaNameForm() {
    const { pacienteN } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const modoEdicion = location.state?.modo === 'editar';
    const ingestaOriginal = location.state?.ingesta || null;

    const [formData, setFormData] = useState({
        tipo: '',
        nombreIngesta: ''
    });

    // Prellenar en modo edición
    useEffect(() => {
        if (modoEdicion && ingestaOriginal) {
            setFormData({
                tipo: ingestaOriginal.tipo || '',
                nombreIngesta: ingestaOriginal.nombre || ''
            });
        }
    }, [modoEdicion, ingestaOriginal]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const manejarSiguiente = () => {
        if (!formData.tipo || !formData.nombreIngesta) {
            alert('Por favor completa todos los campos');
            return;
        }

        navigate(`/planificacion_dieta/${encodeURIComponent(pacienteN)}/crear_ingesta/${encodeURIComponent(formData.nombreIngesta)}`, {
            state: {
                tipo: formData.tipo,
                modo: modoEdicion ? 'editar' : 'crear',
                ingesta: modoEdicion ? ingestaOriginal : null
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
                        name="nombreIngesta"
                        value={formData.nombreIngesta}
                        onChange={handleChange}
                        disabled={modoEdicion} // Desactivar si estamos editando
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
