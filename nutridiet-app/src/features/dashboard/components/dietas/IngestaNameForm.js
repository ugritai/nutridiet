import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, FormControl, FormLabel, MenuItem, TextField, Typography } from '@mui/material';
import Dashboard from '../../Dashboard';
const tiposIngesta = ['3 comidas', '5 comidas'];

export default function IngestaNameForm() {
    const { pacienteN } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({ tipo: '', nombreIngesta: '' });

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const manejarSiguiente = () => {
        if (!formData.tipo || !formData.nombreIngesta) {
            alert('Por favor completa todos los campos');
            return;
        }
        // Navegar a la página 2 con el nombre de ingesta en la URL
        navigate(`/planificacion_dieta/${encodeURIComponent(pacienteN)}/crear_ingesta/${encodeURIComponent(formData.nombreIngesta)}`, {
            state: { tipo: formData.tipo } // También puedes pasar el tipo por estado
        });
    };

    return (
        <Dashboard>
            <Box sx={{ mx: 'auto', mt: 5 }}>
                <Typography variant="h5" gutterBottom>
                    Crear nueva Ingesta
                </Typography>

                <FormControl fullWidth sx={{ mb: 2 }}>
                    <FormLabel>Nombre de la Ingesta</FormLabel>
                    <TextField
                        name="nombreIngesta"
                        value={formData.nombreIngesta}
                        onChange={handleChange}
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
                        Siguiente
                    </Button>
                </Box>
            </Box>
        </Dashboard>
    );
}
