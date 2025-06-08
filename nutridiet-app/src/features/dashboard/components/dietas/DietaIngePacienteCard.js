import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Dashboard from '../../Dashboard';
import CrearDietaCard from './CrearDietaCard';
import CrearIngestaCard from './CrearIngestaCard';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import dayjs from 'dayjs';
dayjs.extend(isSameOrBefore);

import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    IconButton,
    Tabs,
    Tab,
    Typography,
    Box,
    Divider,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Pagination
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { fetchWithAuth } from '../api';
import IngestaCard from './ingestas/IngestaCard';

export default function DietaIngePacienteCard() {
    const navigate = useNavigate();
    const { pacienteN } = useParams();
    const [tabSeleccionada, setTabSeleccionada] = useState(0);
    const [filtroTipo, setFiltroTipo] = useState('');
    const [paginaIngestas, setPaginaIngestas] = useState(1);
    const [paginaDietas, setPaginaDietas] = useState(1);
    const itemsPorPagina = 5;

    const [dietasExistentes, setDietasExistentes] = useState([]);
    const [ingestasExistentes, setIngestasExistentes] = useState([]);

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

    useEffect(() => {
        const fetchIngestas = async () => {
            try {
                const res = await fetch(`http://localhost:8000/planificacion_ingestas/ingestas/${pacienteN}`);
                if (!res.ok) throw new Error('No se pudieron obtener las ingestas');
                const data = await res.json();
                setIngestasExistentes(data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchIngestas();
    }, [pacienteN]);

    useEffect(() => {
        setPaginaIngestas(1);
    }, [filtroTipo]);

    const ingestasFiltradas = ingestasExistentes.filter(
        (ing) => !filtroTipo || ing.intake_type === filtroTipo
    );
    const totalPaginasIngestas = Math.ceil(ingestasFiltradas.length / itemsPorPagina);
    const ingestasPaginadas = ingestasFiltradas.slice(
        (paginaIngestas - 1) * itemsPorPagina,
        paginaIngestas * itemsPorPagina
    );

    const totalPaginasDietas = Math.ceil(dietasExistentes.length / itemsPorPagina);
    const dietasPaginadas = dietasExistentes.slice(
        (paginaDietas - 1) * itemsPorPagina,
        paginaDietas * itemsPorPagina
    );

    const handleEditarDieta = (dieta) => {
        navigate(`/planificacion_dieta/${encodeURIComponent(pacienteN)}/editar_dieta/${encodeURIComponent(dieta.nombre_dieta)}`, {
            state: { dietaId: dieta._id }
        });
    };

    const handleEliminarDieta = async (dieta) => {
        if (window.confirm('¿Estás seguro de eliminar esta dieta?')) {
            // llamada al backend para eliminar
        }
    };

    const handleEditarIngesta = async (idIngesta) => {
        try {
            const res = await fetchWithAuth(
                `/planificacion_ingestas/ver_ingesta/${encodeURIComponent(pacienteN)}/${encodeURIComponent(idIngesta)}`
            );
            if (!res.ok) throw new Error('No se pudo cargar la ingesta');
            const data = await res.json();
            navigate(`/planificacion_dieta/${encodeURIComponent(pacienteN)}/editar_ingesta`, {
                state: {
                    modo: 'editar',
                    ingesta: {
                        nombre: data.intake_name,
                        tipo: data.intake_type,
                        id: data._id,
                        recipes: data.recipes, 
                        ingesta_universal: data.intake_universal 
                    }
                }
            });
        } catch (err) {
            console.error('Error al cargar la ingesta:', err);
            alert('No se pudo cargar la ingesta para editar');
        }
    };

    const handleEliminarIngesta = async (idIngesta) => {
        const confirmado = window.confirm(`¿Estás seguro de eliminar la ingesta?`);
      
        if (!confirmado) return;
      
        try {
          const res = await fetchWithAuth(
            `/planificacion_ingestas/eliminar_ingesta/${encodeURIComponent(pacienteN)}/${encodeURIComponent(idIngesta)}`,
            {
              method: 'DELETE',
            }
          );
      
          if (!res.ok) throw new Error('No se pudo eliminar la ingesta');
      
          alert('Ingesta eliminada correctamente');
          navigate(`/planificacion_dieta/${encodeURIComponent(pacienteN)}`);
          setIngestasExistentes(prev => prev.filter(i => i._id !== idIngesta));
        } catch (error) {
          console.error('Error al eliminar:', error);
          alert('Ocurrió un error al intentar eliminar la ingesta.');
        }
      };

    return (
        <Dashboard>
            <Typography variant="h4">{pacienteN}</Typography>

            <Box sx={{ width: '100%', display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                <CrearDietaCard onClick={() => navigate(`/planificacion_dieta/${pacienteN}/crear_dieta`)} />
                <CrearIngestaCard onClick={() => navigate(`/planificacion_dieta/${pacienteN}/crear_ingesta`)} />
            </Box>

            <Tabs value={tabSeleccionada} onChange={(e, newValue) => setTabSeleccionada(newValue)} sx={{ mb: 3 }}>
                <Tab label="Ingestas" />
                <Tab label="Dietas" />
            </Tabs>

            {tabSeleccionada === 0 && (
                <Box sx={{ width: '100%' }}>
                    <Typography variant="h6">Ingestas diarias del paciente</Typography>

                    <FormControl sx={{ mb: 2, minWidth: 200 }} size="small">
                        <InputLabel>Filtrar por tipo</InputLabel>
                        <Select
                            value={filtroTipo}
                            label="Filtrar por tipo"
                            onChange={(e) => setFiltroTipo(e.target.value)}
                        >
                            <MenuItem value="">Todos</MenuItem>
                            <MenuItem value="Desayuno">Desayuno</MenuItem>
                            <MenuItem value="Media mañana">Media mañana</MenuItem>
                            <MenuItem value="Almuerzo">Almuerzo</MenuItem>
                            <MenuItem value="Merienda">Merienda</MenuItem>
                            <MenuItem value="Cena">Cena</MenuItem>
                        </Select>
                    </FormControl>

                    {ingestasPaginadas.map((ingesta, idx) => (
                        <IngestaCard
                            key={idx}
                            ingesta={ingesta}
                            onEdit={() => handleEditarIngesta(ingesta._id)}
                            onDelete={() => handleEliminarIngesta(ingesta._id)}
                        />
                    ))}

                    {totalPaginasIngestas > 1 && (
                        <Pagination
                            count={totalPaginasIngestas}
                            page={paginaIngestas}
                            onChange={(e, value) => setPaginaIngestas(value)}
                            sx={{ mt: 2 }}
                        />
                    )}
                </Box>
            )}

            {tabSeleccionada === 1 && (
                <Box sx={{ mt: 4, width: '100%' }}>
                    <Typography variant="h6">Dietas del paciente</Typography>

                    {dietasPaginadas.map((dieta, idx) => (
                        <Accordion key={idx} sx={{ mt: 2 }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography sx={{ flexGrow: 1 }}>{dieta.nombre_dieta}</Typography>
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

                    {totalPaginasDietas > 1 && (
                        <Pagination
                            count={totalPaginasDietas}
                            page={paginaDietas}
                            onChange={(e, value) => setPaginaDietas(value)}
                            sx={{ mt: 2 }}
                        />
                    )}
                </Box>
            )}
        </Dashboard>
    );
}
