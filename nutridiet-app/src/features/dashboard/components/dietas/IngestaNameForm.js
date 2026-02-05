import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Box, Button, FormControl, FormLabel, MenuItem, TextField, Typography } from '@mui/material';
import Dashboard from '../../Dashboard';

const tiposIngesta = ['Desayuno', 'Media mañana', 'Almuerzo', 'Merienda', 'Cena'];

export default function IngestaNameForm({
    onClose = null,
    paciente: propPaciente = null,
    modo: propModo = null,
    ingesta: propIngesta = null,
}) {
    const routeParams = useParams();
    const routeNavigate = useNavigate();
    const routeLocation = useLocation();

    // Modal o ruta
    const isDialog = typeof onClose === 'function';
    const modo = isDialog ? 'crear' : (propModo || routeLocation.state?.modo || 'crear');

    const ingestaOriginal = isDialog ? null : (propIngesta || routeLocation.state?.ingesta || null);
    
    // Recuperamos el ID con seguridad
    const pacienteN = propPaciente || routeParams.patientId || routeParams.pacienteN;

    const [formData, setFormData] = useState({
        tipo: '',
        nombre: ''
    });

    useEffect(() => {
        if (modo === 'editar' && ingestaOriginal) {
            setFormData({
                tipo: ingestaOriginal.tipo || '',
                nombre: ingestaOriginal.nombre || ''
            });
        }
    }, [modo, ingestaOriginal]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const manejarSiguiente = () => {
        if (!formData.tipo || !formData.nombre) {
            alert('Por favor completa todos los campos');
            return;
        }

        // SEGURIDAD: Si no tenemos ID de paciente, no navegamos
        if (!isDialog && !pacienteN) {
            console.error("Error crítico: ID de paciente no encontrado (undefined)");
            alert("Error: No se ha identificado al paciente.");
            return;
        }

        if (isDialog) {
            onClose({
                tipo: formData.tipo,
                nombre: formData.nombre
            });
            return;
        }

        const ruta = modo === 'editar'
            ? `/planificacion_dieta/${encodeURIComponent(pacienteN)}/editar_ingesta/${encodeURIComponent(formData.nombre)}`
            : `/planificacion_dieta/${encodeURIComponent(pacienteN)}/crear_ingesta/${encodeURIComponent(formData.nombre)}`;

        routeNavigate(ruta, {
            state: {
                modo,
                tipo: formData.tipo,
                ingesta: {
                    ...ingestaOriginal,
                    nombre: formData.nombre,
                    tipo: formData.tipo
                }
            }
        });
    };

    const content = (
        <Box sx={{ mx: 'auto', mt: 5, maxWidth: 600, p: 2 }}>
            <Typography variant="h5" gutterBottom>
                {modo === 'editar' ? 'Editar Ingesta' : 'Crear nueva Ingesta'}
            </Typography>

            <FormControl fullWidth sx={{ mb: 2 }}>
                <FormLabel>Nombre de la Ingesta</FormLabel>
                <TextField
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    disabled={modo === 'editar'}
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

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button
                    variant="outlined"
                    onClick={() =>
                        isDialog
                            ? onClose(null)
                            : routeNavigate(pacienteN ? `/planificacion_dieta/${encodeURIComponent(pacienteN)}` : '/planificacion_dieta')
                    }
                >
                    Atrás
                </Button>

                <Button variant="contained" color="primary" onClick={manejarSiguiente}>
                    {modo === 'editar' ? 'Editar Ingesta' : 'Siguiente'}
                </Button>
            </Box>
        </Box>
    );

    return isDialog ? content : <Dashboard>{content}</Dashboard>;
}