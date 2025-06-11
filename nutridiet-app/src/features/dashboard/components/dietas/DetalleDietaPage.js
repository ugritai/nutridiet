import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    Box, Typography, Card, CardContent, Button, CircularProgress, Divider, Stack
} from '@mui/material';
import Dashboard from '../../Dashboard';
import { fetchWithAuth } from '../api';

export default function DetalleDietaPage() {
    
    const location = useLocation();
    const dietaId = location.state?.dietaId;
    const navigate = useNavigate();
    const [dieta, setDieta] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!dietaId) return;
        const fetchDieta = async () => {
            try {
                const res = await fetchWithAuth(`/planificacion_dietas/ver_dieta_detalle/${dietaId}`);
                if (!res.ok) throw new Error('No se pudo cargar la dieta');
                const data = await res.json();
                console.log("dieta", data)
                setDieta(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDieta();
    }, [dietaId]);

    const handleDescargarTexto = () => {
        const contenido = JSON.stringify(dieta, null, 2);
        const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `dieta_${dieta?.name || 'paciente'}.txt`;
        link.click();
    };

    if (loading) {
        return <Dashboard><CircularProgress /></Dashboard>;
    }

    if (!dieta) {
        return <Dashboard><Typography color="error">Dieta no encontrada</Typography></Dashboard>;
    }    

    return (
        <Dashboard>
            <Box sx={{ p: 2 }}>
                <Typography variant="h4" gutterBottom>{dieta.name}</Typography>
                <Typography variant="subtitle1">Paciente: {dieta.patient_name}</Typography>
                <Typography variant="subtitle1">Nutricionista: {dieta.nutritionist_email}</Typography>
                <Typography variant="subtitle1">
                    Fecha: {new Date(dieta.start_date).toLocaleDateString()} - {new Date(dieta.end_date).toLocaleDateString()}
                </Typography>

                <Button variant="outlined" onClick={handleDescargarTexto} sx={{ mt: 2 }}>
                    Descargar dieta como texto
                </Button>

                <Divider sx={{ my: 3 }} />

                {dieta.days.map((dia, i) => (
                    <Box key={i} sx={{ mb: 4 }}>
                        <Typography variant="h6" gutterBottom>
                            Día {i + 1} - {new Date(dia.date).toLocaleDateString()}
                        </Typography>

                        {dia.intakes.map((ingesta, j) => (
                            <Card key={j} sx={{ mb: 2 }}>
                                <CardContent>
                                    <Typography variant="subtitle1" gutterBottom>
                                        {ingesta.intake_name} ({ingesta.intake_type})
                                    </Typography>

                                    <Stack spacing={1}>
                                        {ingesta.recipes?.map((receta, k) => (
                                            <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Typography>{receta.name}</Typography>
                                                <Button
                                                    size="small"
                                                    onClick={() => {
                                                        sessionStorage.setItem('breadcrumb_dieta_nombre', dieta.name);
                                                        sessionStorage.setItem('breadcrumb_dieta_id', dieta._id);
                                                        navigate(`/recetas/detalle_receta/${encodeURIComponent(receta.name)}`);
                                                    }}
                                                >
                                                    Ver receta
                                                </Button>
                                            </Box>
                                        ))}
                                    </Stack>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                ))}
            </Box>
        </Dashboard>
    );
}
