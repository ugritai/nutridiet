import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard from '../../Dashboard';
import CrearDietaCard from './CrearDietaCard';
import CrearIngestaCard from './CrearIngestaCard';
import { useParams } from 'react-router-dom';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    IconButton,
    Card,
    Typography,
    Box, Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import dayjs from 'dayjs';
import { fetchWithAuth } from '../api';



dayjs.extend(isSameOrBefore);


export default function DietaIngePacienteCard() {
    const navigate = useNavigate();
    const { pacienteN } = useParams();

    const [dietasExistentes, setDietasExistentes] = useState([]);

    useEffect(() => {
        const fetchDietas = async () => {
            try {
                const res = await fetch(`http://localhost:8000/planificacion_dietas/dietas_paciente/${pacienteN}`);
                if (!res.ok) throw new Error('No se pudieron obtener las dietas existentes');
                const data = await res.json();
                setDietasExistentes(data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchDietas();
    }, [pacienteN]);

    const [ingestasExistentes, setIngestasExistentes] = useState([]);

    useEffect(() => {
        const fetchIngestas = async () => {
            try {
                const res = await fetch(`http://localhost:8000/planificacion_ingestas/ingestas/${pacienteN}`);
                if (!res.ok) throw new Error('No se pudieron obtener las dietas existentes');
                const data = await res.json();
                setIngestasExistentes(data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchIngestas();
    }, [pacienteN]);


    const handleEditarDieta = (dieta) => {
        console.log(dieta)
        navigate(`/planificacion_dieta/${encodeURIComponent(pacienteN)}/editar_dieta/${encodeURIComponent(dieta.nombre_dieta)}`, {
            state: { dietaId: dieta._id }
        });
    };


    const handleEliminarDieta = async (dieta) => {
        if (window.confirm('¿Estás seguro de eliminar esta dieta?')) {
            // llamada al backend para eliminar
        }
    };

    const handleEditarIngesta = async (ingesta) => {
        try {
            const res = await fetchWithAuth(
                `/planificacion_ingestas/ver_ingesta/${encodeURIComponent(pacienteN)}/${encodeURIComponent(ingesta)}`
            );
            if (!res.ok) throw new Error('No se pudo cargar la ingesta');

            const data = await res.json();
            navigate(`/planificacion_dieta/${encodeURIComponent(pacienteN)}/editar_ingesta`, {
                state: {
                    modo: 'editar',
                    ingesta: {
                        tipo_diario: data.tipo_diario,
                        nombre: data.intake_name,
                        subingestas: data.subingestas
                    }
                }
            });
        } catch (err) {
            console.error('Error al cargar la ingesta:', err);
            alert('No se pudo cargar la ingesta para editar');
        }
    };

    const handleEliminarIngesta = async (ingesta) => {
        if (window.confirm('¿Estás seguro de eliminar esta ingesta?')) {
            // llamada al backend para eliminar
        }
    };

    return (
        <Dashboard>

            <Typography variant="h4">
                {pacienteN}
            </Typography>
            <Box sx={{ width: '100%', display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                <CrearDietaCard onClick={() => navigate(`/planificacion_dieta/${pacienteN}/crear_dieta`)} />
                <CrearIngestaCard onClick={() => navigate(`/planificacion_dieta/${pacienteN}/crear_ingesta`)} />
            </Box>


            <Box sx={{ mt: 4, width: '100%' }}>
                <Typography variant="h6">Ingestas diarias del paciente</Typography>
                {ingestasExistentes.map((grupo, idx) => (
                    <Accordion key={idx} sx={{ mt: 2 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography sx={{ flexGrow: 1 }}>
                                {grupo.intake_name}
                            </Typography>
                            <IconButton size="small" onClick={() => handleEditarIngesta(grupo.intake_name)}>
                                <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleEditarIngesta(grupo.intake_name)}>
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </AccordionSummary>

                        <AccordionDetails>
                            {(grupo.subingestas || []).map((ingesta, subIdx) => (
                                <Box key={subIdx} sx={{ mb: 2 }}>
                                    <Typography fontWeight="bold" sx={{ mb: 1 }}>
                                        {ingesta.intake_type}
                                    </Typography>

                                    {(Array.isArray(ingesta.recipes)
                                        ? ingesta.recipes
                                        : Object.values(ingesta.recipes || {}).flat()
                                    ).map((receta, i) => (
                                        <Typography key={i} variant="body2" sx={{ ml: 2 }}>
                                            - <strong>{receta.recipe_type || "Sin tipo"}:</strong> {receta.name}
                                        </Typography>
                                    ))}
                                </Box>
                            ))}
                        </AccordionDetails>
                    </Accordion>))}
            </Box>


            {dietasExistentes.length > 0 && (
                <Box sx={{ mt: 4, width: '100%' }}>
                    <Typography variant="h6">Dietas del paciente</Typography>

                    {dietasExistentes.map((dieta, idx) => (
                        <Accordion key={idx} sx={{ mt: 2 }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography sx={{ flexGrow: 1 }}>
                                    {dieta.nombre_dieta}
                                </Typography>
                                <IconButton size="small" onClick={() => handleEditarDieta(dieta)}>
                                    <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton size="small" onClick={() => handleEliminarDieta(dieta)}>
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </AccordionSummary>

                            <AccordionDetails>
                                {dieta.dias.map((dia, diaIdx) => (
                                    <Box key={diaIdx} sx={{ mb: 2 }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                                            Día {diaIdx + 1} - {dayjs(dia.fecha).format('DD/MM/YYYY')}
                                        </Typography>

                                        {dia.ingestas.length > 0 ? (
                                            dia.ingestas.map((ingesta, i) => {
                                                const detalles = ingesta.detalles;
                                                return (
                                                    detalles && (
                                                        <Box key={i} sx={{ pl: 2, mb: 2 }}>
                                                            <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                                                                {detalles.intake_type}
                                                            </Typography>
                                                            {detalles.recipes.map((receta, rIdx) => (
                                                                <Typography key={rIdx} variant="body2" sx={{ pl: 2 }}>
                                                                    - {receta.recipe_type}: {receta.name}
                                                                </Typography>
                                                            ))}
                                                        </Box>
                                                    )
                                                );
                                            })
                                        ) : (
                                            <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary', pl: 2 }}>
                                                No hay ingestas para este día.
                                            </Typography>
                                        )}

                                        {diaIdx < dieta.dias.length - 1 && <Divider sx={{ my: 2 }} />}
                                    </Box>
                                ))}
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Box>
            )}

        </Dashboard>
    );
}
