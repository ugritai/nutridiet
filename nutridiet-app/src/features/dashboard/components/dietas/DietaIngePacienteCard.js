import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Dashboard from '../../Dashboard';
import CrearDietaCard from './CrearDietaCard';
import CrearIngestaCard from './CrearIngestaCard';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import dayjs from 'dayjs';
dayjs.extend(isSameOrBefore);

import {
    Tabs,
    Tab,
    Typography,
    Box,
    Pagination
} from '@mui/material';
import { fetchWithAuth } from '../api';
import ListaIngestas from './ingestas/ListaIngesta';
import ListaDietas from './ingestas/ListaDieta';

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
    const [detallesDieta, setDetallesDieta] = useState({});

    useEffect(() => {
        const fetchDietas = async () => {
            try {
                const res = await fetchWithAuth(`/planificacion_dietas/dietas/${encodeURIComponent(pacienteN)}`);
                if (!res.ok) throw new Error('No se pudieron obtener las dietas');
                const data = await res.json();
                console.log('dieta', data)
                setDietasExistentes(data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchDietas();
    }, [pacienteN]);

    const handleExpandirDieta = async (dietaId) => {
        if (detallesDieta[dietaId]) return; 
        try {
            const res = await fetchWithAuth(`/planificacion_dietas/ver_dieta_detalle/${dietaId}`);
            if (!res.ok) throw new Error('No se pudo cargar el detalle de la dieta');
            const data = await res.json();
            setDetallesDieta(prev => ({ ...prev, [dietaId]: data }));
        } catch (err) {
            console.error(err);
        }
    };


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

    const handleEditarDieta = async (dieta) => {
        try {
            const res = await fetchWithAuth(
                `/planificacion_dietas/ver_dieta_detalle/${encodeURIComponent(dieta._id)}`
            );
            if (!res.ok) throw new Error('No se pudo cargar la dieta');
            const data = await res.json();
            navigate(`/planificacion_dieta/${encodeURIComponent(pacienteN)}/editar_dieta/${encodeURIComponent(dieta.name)}`, {
                state: {
                    modo: 'editar',
                    dietaId: dieta._id,
                    dietaCompleta: data
                }
            });
        } catch (err) {
            console.error('Error al cargar la dieta:', err);
            alert('No se pudo cargar la dieta para editar');
        }
    };

    const handleEliminarDieta = async (dieta) => {
        const confirmado = window.confirm('¿Estás seguro de eliminar esta dieta?');
    
        if (!confirmado) return;
    
        try {
            const res = await fetchWithAuth(
                `/planificacion_dietas/eliminar_dieta/${encodeURIComponent(pacienteN)}/${encodeURIComponent(dieta._id)}`,
                {
                    method: 'DELETE',
                }
            );
    
            if (!res.ok) throw new Error('No se pudo eliminar la dieta');
    
            alert('Dieta eliminada correctamente');
            setDietasExistentes(prev => prev.filter(d => d._id !== dieta._id));
        } catch (error) {
            console.error('Error al eliminar dieta:', error);
            alert('Ocurrió un error al intentar eliminar la dieta.');
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
                <Tab label="Dietas" />
                <Tab label="Ingestas" />
            </Tabs>

            {tabSeleccionada === 0 && (
                <Box sx={{ mt: 4, width: '100%' }}>
                    <Typography variant="h6">Dietas del paciente</Typography>

                    <ListaDietas
                        dietas={dietasPaginadas}
                        detallesDieta={detallesDieta}
                        onEdit={(dieta) => handleEditarDieta(dieta)} 
                        onDelete={(dieta) => handleEliminarDieta(dieta)} 
                        onExpand={handleExpandirDieta}
                    />

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

            {tabSeleccionada === 1 && (
                <Box sx={{ width: '100%' }}>
                    <Typography variant="h6">Ingestas del paciente</Typography>

                    <ListaIngestas
                        ingestas={ingestasExistentes}
                        onEdit={(ing) => handleEditarIngesta(ing._id)}
                        onDelete={(ing) => handleEliminarIngesta(ing._id)}
                    />


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

        </Dashboard>
    );
}
