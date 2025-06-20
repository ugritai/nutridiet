import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Button,
} from '@mui/material';
import { fetchWithAuth } from '../api';

export default function SeleccionPacientePage() {
    const navigate = useNavigate();
    const [pacientes, setPacientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);

    useEffect(() => {
        async function fetchPacientes() {
            try {
                setLoading(true);
                const res = await fetchWithAuth('/pacientes/mis_pacientes', {
                    method: 'GET',
                });
                if (!res.ok) throw new Error('Error al cargar pacientes');
                const data = await res.json();
                setPacientes(data);
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }
        fetchPacientes();
    }, []);

    const continuar = () => {
        if (!pacienteSeleccionado) {
            alert('Selecciona un paciente');
            return;
        }
        // Navega a la ruta con paciente id y tipo fijo en ruta
        navigate(`/planificacion_dieta/${pacienteSeleccionado.name}`);
    };

    return (
        <Box>
            <Typography variant="h4">
                Selecciona un paciente para crear dieta o ingesta
            </Typography>

            <Box sx={{ Width: '100%', textAlign: 'center' }}>
                {loading && <Typography mb={2}>Cargando pacientes...</Typography>}
                {error && <Typography color="error" mb={2}>{error}</Typography>}

                {!loading && !error && (
                    <List>
                        {pacientes.map((p) => (
                            <ListItem key={p.id} disablePadding>
                                <ListItemButton
                                    selected={pacienteSeleccionado?.id === p.id}
                                    onClick={() => setPacienteSeleccionado(p)}
                                    sx={{
                                        '&.Mui-selected': {
                                            bgcolor: '#f5f5f5'
                                        }
                                    }}
                                >
                                    <ListItemText
                                        primary={p.name}
                                        primaryTypographyProps={{ variant: 'body1' }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                )}

                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => navigate('/planificacion_dieta')}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={continuar}
                        disabled={!pacienteSeleccionado}
                    >
                        Continuar
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}
