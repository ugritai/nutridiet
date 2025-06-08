import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import {
    Card, Typography, Button, Box, IconButton
} from '@mui/material';
import Dashboard from '../../Dashboard';
import dayjs from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useNavigate } from 'react-router-dom';
import CloseIcon from '@mui/icons-material/Close';
import FoodSearch from '../../components/FoodSearch';
import Search from '../Search';
import { Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';




dayjs.extend(isSameOrBefore);

export default function CrearDietaForm() {
    const { pacienteN, nombreDieta } = useParams();
    const location = useLocation();
    const idDieta = location.state?.dietaId;
    const navigate = useNavigate();
    const [nutricion, setNutricion] = useState(null);
    const [fechaInicio, setFechaInicio] = useState(null);
    const [fechaFin, setFechaFin] = useState(null);

    const [paso, setPaso] = useState(1);

    useEffect(() => {
        console.log("iddd" + idDieta)
        if (!idDieta) return;
        const fetchDieta = async () => {
            try {
                const res = await fetch(`http://localhost:8000/planificacion_dietas/dieta_por_id/${idDieta}`);
                if (!res.ok) throw new Error('No se pudo cargar la dieta');

                const data = await res.json();

                setFechaInicio(dayjs(data.fecha_inicio));
                setFechaFin(dayjs(data.fecha_final));

                const nuevoPlan = {};
                for (const dia of data.dias) {
                    const fecha = dayjs(dia.fecha).format('DD/MM/YYYY');
                    nuevoPlan[fecha] = dia.ingestas.map((ing) => ({
                        _id: ing.intake_id,
                        intake_name: ing.detalles?.nombre_ingesta || 'Sin nombre',
                    }));
                }
                setDiasPlanificados(nuevoPlan);
            } catch (err) {
                console.error('Error al cargar la dieta:', err);
                alert('No se pudo cargar la dieta');
            }
        };

        fetchDieta();
    }, [idDieta]);


    useEffect(() => {
        const fetchInfoPaciente = async () => {
            try {
                const res = await fetch(`http://localhost:8000/pacientes/paciente_info/${pacienteN}`);
                if (!res.ok) throw new Error('No se pudo obtener la información del paciente');
                const data = await res.json();
                setNutricion(data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchInfoPaciente();
    }, [pacienteN]);

    const manejarSiguiente = () => {
        if (!fechaInicio || !fechaFin) {
            alert('Por favor selecciona ambas fechas');
            return;
        }
        if (dayjs(fechaFin).isBefore(dayjs(fechaInicio))) {
            alert('La fecha fin no puede ser anterior a la fecha inicio');
            return;
        }
        setPaso(2);
    };

    const buscadorIngestas = FoodSearch({ type: 'ingestas' });

    const [ingestasDisponibles, setIngestasDisponibles] = useState([]);
    const [diasPlanificados, setDiasPlanificados] = useState({}); // { fecha: [ingestaObj, ...] }

    useEffect(() => {
        const fetchIngestas = async () => {
            try {
                const res = await fetch(`http://localhost:8000/planificacion_ingestas/ingestas/${pacienteN}`);
                if (!res.ok) throw new Error('No se pudieron cargar las ingestas');
                const data = await res.json();

                // Agrupar subingestas por intake_name
                const agrupadas = {};

                for (const ingesta of data) {
                    for (const sub of ingesta.subingestas || []) {
                        const key = sub.nombre_ingesta;
                        if (!agrupadas[key]) {
                            agrupadas[key] = {
                                intake_name: key,
                                _id: sub._id, // uno cualquiera
                                subingestas: [],
                            };
                        }

                        // Agrupar recetas por tipo
                        const recetasPorTipo = {};
                        for (const receta of sub.recipes || []) {
                            const tipo = receta.recipe_type?.toLowerCase().replace(/\s/g, '_') || 'otro';
                            if (!recetasPorTipo[tipo]) recetasPorTipo[tipo] = [];
                            recetasPorTipo[tipo].push(receta);
                        }

                        agrupadas[key].subingestas.push({
                            intake_type: sub.intake_type,
                            recipes: recetasPorTipo,
                        });
                    }
                }

                setIngestasDisponibles(Object.values(agrupadas));

            } catch (err) {
                console.error(err);
            }
        };

        fetchIngestas();
    }, [pacienteN]);

    const handleAgregarIngesta = async (nombreIngesta) => {
        try {
            const res = await fetch(`http://localhost:8000/planificacion_ingestas/ver_ingesta_detalle/${encodeURIComponent(nombreIngesta)}`);
            if (!res.ok) throw new Error('No se pudo cargar la ingesta');
            const data = await res.json();

            // Agrupar recetas por tipo
            const recetasPorTipo = {};
            for (const receta of data.recipes || []) {
                const tipo = receta.recipe_type?.toLowerCase().replace(/\s/g, '_') || 'otro';
                if (!recetasPorTipo[tipo]) recetasPorTipo[tipo] = [];
                recetasPorTipo[tipo].push(receta);
            }

            // Construir estructura como en fetchIngestas
            const nuevaIngesta = {
                intake_name: data.nombre_ingesta,
                _id: data._id,
                subingestas: [{
                    intake_type: data.intake_type,
                    recipes: recetasPorTipo,
                }],
            };

            setIngestasDisponibles(prev => [...prev, nuevaIngesta]);
            buscador.setQuery('');
            buscador.setSuggestions([]);

        } catch (err) {
            console.error('❌ Error al añadir ingesta:', err);
            alert('No se pudo añadir la ingesta');
        }
    };




    const generarFechasPlanificacion = () => {
        if (!fechaInicio || !fechaFin) return [];

        const fechas = [];
        let fecha = dayjs(fechaInicio);

        while (fecha.isSameOrBefore(fechaFin)) {
            fechas.push(fecha.format('DD/MM/YYYY'));
            fecha = fecha.add(1, 'day');
        }

        return fechas;
    };

    // Función para manejar drag and drop
    const onDragEnd = (result) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;

        if (source.droppableId === destination.droppableId && source.index === destination.index) {
            return;
        }

        const realId = draggableId;

        if (source.droppableId === 'disponibles') {
            const ingesta = ingestasDisponibles.find(i => i._id === realId);
            if (!ingesta) return;

            setDiasPlanificados(prev => {
                const diaActual = prev[destination.droppableId] || [];

                // Permitir duplicación usando un _id único
                const nuevaIngesta = { ...ingesta, _id: `${realId}-${Date.now()}` };

                return {
                    ...prev,
                    [destination.droppableId]: [...diaActual, nuevaIngesta]
                };
            });
            return;
        }

        // Mover dentro del mismo día o entre días
        if (source.droppableId !== 'disponibles') {
            setDiasPlanificados(prev => {
                const sourceList = Array.from(prev[source.droppableId] || []);
                const [moved] = sourceList.splice(source.index, 1);

                if (source.droppableId === destination.droppableId) {
                    sourceList.splice(destination.index, 0, moved);
                    return { ...prev, [source.droppableId]: sourceList };
                } else {
                    const destList = Array.from(prev[destination.droppableId] || []);
                    if (destList.find(i => i._id === moved._id)) return prev;
                    destList.splice(destination.index, 0, moved);
                    return {
                        ...prev,
                        [source.droppableId]: sourceList,
                        [destination.droppableId]: destList,
                    };
                }
            });
        }
    };

    const guardarDieta = async () => {
        try {
            const payload = {
                paciente: pacienteN,
                name: idDieta
                    ? nombreDieta || 'Dieta sin nombre'
                    : `Dieta ${pacienteN} - ${fechaInicio.format('DD/MM/YYYY')} al ${fechaFin.format('DD/MM/YYYY')}`,
                start_date: fechaInicio.format('YYYY-MM-DD'),
                end_date: fechaFin.format('YYYY-MM-DD'),
                dias: Object.entries(diasPlanificados)
                    .map(([fecha, ingestas]) => {
                        const fechaFormateada = dayjs(fecha, ['DD/MM/YYYY', 'YYYY-MM-DD'], true);
                        return fechaFormateada.isValid()
                            ? {
                                fecha: fechaFormateada.format('YYYY-MM-DD'),
                                ingestas: ingestas.map((ing) => ({ intake_id: ing._id })),
                            }
                            : null;
                    })
                    .filter(Boolean),
            };

            const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');

            const url = idDieta
                ? `http://localhost:8000/planificacion_dietas/editar_dieta/${idDieta}`
                : 'http://localhost:8000/planificacion_dietas/crear_dieta/';

            const method = idDieta ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error('Error al guardar la dieta');

            alert(idDieta ? 'Dieta actualizada con éxito' : 'Dieta guardada con éxito');
            navigate(`/planificacion_dieta/${encodeURIComponent(pacienteN)}`);
        } catch (err) {
            console.error(err);
            alert('Hubo un error al guardar la dieta');
        }
    };

    return (
        <Dashboard>
            <Box mb={2}>
                <Typography variant="h4">
                    {idDieta ? 'Editar dieta' : 'Crear dieta'} para paciente: {pacienteN}
                </Typography>

                {idDieta && (
                    <Typography variant="subtitle1" color="text.secondary">
                        Nombre de la dieta: <strong>{nombreDieta}</strong>
                    </Typography>
                )}
            </Box>

            <Card sx={{ p: 3, mt: 2, width: '100%' }}>

                {paso === 1 && (
                    <>
                        <Typography variant="h6" gutterBottom>Selecciona el rango de fechas</Typography>
                        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
                            <DatePicker
                                key={fechaInicio?.toString()}
                                label="Fecha inicio"
                                value={fechaInicio}
                                onChange={(newValue) => setFechaInicio(newValue)}
                                format="DD/MM/YYYY"
                                sx={{ mb: 2, mt: 2 }}
                            />

                            <DatePicker
                                key={fechaFin?.toString()}
                                label="Fecha fin"
                                value={fechaFin}
                                onChange={(newValue) => setFechaFin(newValue)}
                                format="DD/MM/YYYY"
                                sx={{ mb: 2, mt: 2 }}
                            />

                        </LocalizationProvider>

                        <Box sx={{ mt: 3, display: 'flex', gap: 5 }}>
                            <Button
                                variant="outlined"
                                onClick={() => navigate(`/planificacion_dieta/${pacienteN}`)}
                            >
                                Atrás
                            </Button>
                            <Button variant="contained" color="primary" onClick={manejarSiguiente}>
                                Siguiente
                            </Button>
                        </Box>
                    </>
                )}

                {paso === 2 && (
                    <>
                        <Typography variant="h6" gutterBottom>Confirmar creación de dieta</Typography>
                        <Typography>Desde: {fechaInicio?.format('DD/MM/YYYY')}</Typography>
                        <Typography>Hasta: {fechaFin?.format('DD/MM/YYYY')}</Typography>

                        <Search
                            value={buscadorIngestas.query}
                            onChange={(val) => {
                                buscadorIngestas.setQuery(val);
                                buscadorIngestas.handleSuggestions(val);
                            }}
                            onSubmit={(val) => {
                                handleAgregarIngesta(val);
                                buscadorIngestas.setQuery('');
                                buscadorIngestas.setSuggestions([]);
                            }}
                            suggestions={buscadorIngestas.suggestions}
                            placeholder="Buscar ingesta"
                            suggestionClick={handleAgregarIngesta}
                            showButton={false}
                        />




                        <DragDropContext onDragEnd={onDragEnd}>

                            {/* Ingestas disponibles */}
                            <Typography variant="h6" mt={3}>Ingestas disponibles</Typography>
                            <Droppable droppableId="disponibles" direction="vertical">
                                {(provided) => (
                                    <Box
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        sx={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: 2,
                                            mb: 4,
                                            p: 2,
                                            border: '1px dashed gray',
                                            borderRadius: 2,
                                            minHeight: 100,
                                        }}
                                    >
                                        {ingestasDisponibles.map((grupo, index) => (
                                            <Draggable key={grupo._id} draggableId={grupo._id} index={index}>
                                                {(provided) => (
                                                    <Box
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        sx={{ width: '100%', maxWidth: 500 }}
                                                    >
                                                        <Accordion elevation={3}>
                                                            <AccordionSummary
                                                                expandIcon={<ExpandMoreIcon />}
                                                                {...provided.dragHandleProps} // Aquí se permite arrastrar desde el resumen
                                                                sx={{
                                                                    backgroundColor: '#f5f5f5',
                                                                    cursor: 'grab',
                                                                    userSelect: 'none'
                                                                }}
                                                            >
                                                                <Typography fontWeight="bold">{grupo.intake_name}</Typography>
                                                            </AccordionSummary>

                                                            <AccordionDetails>
                                                                {(grupo.subingestas || []).map((sub, subIdx) => (
                                                                    <Box key={subIdx} sx={{ mb: 2 }}>
                                                                        <Typography fontWeight="bold" sx={{ mb: 1 }}>
                                                                            {sub.intake_type}
                                                                        </Typography>

                                                                        {typeof sub.recipes === 'object' && sub.recipes !== null &&
                                                                            Object.entries(sub.recipes).map(([tipo, recetasArray]) => (
                                                                                <Box key={tipo} sx={{ ml: 2, mb: 1 }}>
                                                                                    {recetasArray.map((rec, i) => (
                                                                                        <Typography key={i} variant="body2">
                                                                                            - <strong>{rec.recipe_type || tipo}:</strong> {rec.name}
                                                                                        </Typography>
                                                                                    ))}
                                                                                </Box>
                                                                            ))}
                                                                    </Box>
                                                                ))}
                                                            </AccordionDetails>
                                                        </Accordion>
                                                    </Box>
                                                )}
                                            </Draggable>
                                        ))}



                                        {provided.placeholder}
                                    </Box>
                                )}
                            </Droppable>

                            {/* Planificación por día */}
                            <Typography variant="h6" mt={4}>Planificación por día</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                {generarFechasPlanificacion().map((fecha, idx) => (
                                    <Box key={fecha} sx={{ width: "49%" }}>
                                        <Typography variant="subtitle1" gutterBottom>
                                            Día {idx + 1}<br />{fecha}
                                        </Typography>
                                        <Droppable droppableId={fecha} >
                                            {(provided) => (
                                                <Box
                                                    ref={provided.innerRef}
                                                    {...provided.droppableProps}
                                                    sx={{ p: 2, border: '1px solid #ccc', borderRadius: 2, minHeight: 200 }}
                                                >
                                                    {(diasPlanificados[fecha] || []).map((ing, index) => (
                                                        <Draggable
                                                            key={`${fecha}-${ing._id}`}
                                                            draggableId={`${fecha}-${ing._id}`}
                                                            index={index}
                                                        >
                                                            {(provided, snapshot) => (
                                                                <Box
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    sx={{
                                                                        p: 1,
                                                                        mb: 1,
                                                                        bgcolor: snapshot.isDragging ? '#e0f7fa' : 'background.paper',
                                                                        border: '1px solid #ccc',
                                                                        borderRadius: 1,
                                                                        boxShadow: snapshot.isDragging ? 4 : 0,
                                                                        ...provided.draggableProps.style,
                                                                    }}
                                                                >
                                                                    {/* MIENTRAS SE ARRASTRA: solo nombre */}
                                                                    {snapshot.isDragging ? (
                                                                        <Typography variant="subtitle2" fontWeight="bold">
                                                                            {ing.intake_name}
                                                                        </Typography>
                                                                    ) : (
                                                                        // AL SOLTAR: nombre con botón eliminar
                                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                            <Typography variant="subtitle2" fontWeight="bold">
                                                                                {ing.intake_name}
                                                                            </Typography>
                                                                            <IconButton
                                                                                size="small"
                                                                                onClick={() => {
                                                                                    setDiasPlanificados(prev => ({
                                                                                        ...prev,
                                                                                        [fecha]: prev[fecha].filter(i => i._id !== ing._id)
                                                                                    }));
                                                                                }}
                                                                            >
                                                                                <CloseIcon fontSize="small" />
                                                                            </IconButton>
                                                                        </Box>
                                                                    )}
                                                                </Box>
                                                            )}
                                                        </Draggable>


                                                    ))}

                                                    {provided.placeholder}
                                                </Box>
                                            )}
                                        </Droppable>
                                    </Box>
                                ))}
                            </Box>

                        </DragDropContext>

                        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                            <Button variant="outlined" onClick={() => setPaso(1)}>
                                Volver
                            </Button>
                            <Button variant="contained" color="primary" onClick={guardarDieta}>
                                Guardar dieta
                            </Button>
                        </Box>
                    </>
                )}

            </Card>
        </Dashboard>
    );
}
