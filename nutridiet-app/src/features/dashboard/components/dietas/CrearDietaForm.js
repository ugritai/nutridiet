import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Card, Typography, Button, Box
} from '@mui/material';
import Dashboard from '../../Dashboard';
import dayjs from 'dayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useNavigate } from 'react-router-dom';

dayjs.extend(isSameOrBefore);

export default function CrearDietaForm() {
    const { pacienteN } = useParams();
    const navigate = useNavigate();
    const [nutricion, setNutricion] = useState(null);
    const [fechaInicio, setFechaInicio] = useState(null);
    const [fechaFin, setFechaFin] = useState(null);

    const [paso, setPaso] = useState(1);

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

    const [ingestasDisponibles, setIngestasDisponibles] = useState([]);
    const [diasPlanificados, setDiasPlanificados] = useState({}); // { fecha: [ingestaObj, ...] }

    useEffect(() => {
        const fetchIngestas = async () => {
            try {
                const res = await fetch(`http://localhost:8000/planificacion_ingestas/ingestas/${pacienteN}`);
                if (!res.ok) throw new Error('No se pudieron cargar las ingestas');
                const data = await res.json();
                console.log(data);
                setIngestasDisponibles(data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchIngestas();
    }, [pacienteN]);

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

        // EXTRAER el _id real
        // Si viene con formato "fecha-_id", sacar solo _id
        const realId = draggableId.includes('-') ? draggableId.split('-').slice(1).join('-') : draggableId;

        if (source.droppableId === 'disponibles') {
            const ingesta = ingestasDisponibles.find(i => i._id === realId);
            if (!ingesta) return;

            setDiasPlanificados(prev => {
                const diaActual = prev[destination.droppableId] || [];
                // Evitar duplicados en el mismo día
                if (diaActual.find(i => i._id === realId)) return prev;
                return {
                    ...prev,
                    [destination.droppableId]: [...diaActual, ingesta]
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

    // Convierte 'DD/MM/YYYY' a 'YYYY-MM-DD'
    function convertDateFormat(dateStr) {
        const [day, month, year] = dateStr.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

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


    const guardarDieta = async () => {
        try {
            const payload = {
                paciente: pacienteN,
                name: `Dieta ${pacienteN} - ${fechaInicio.format('DD/MM/YYYY')} al ${fechaFin.format('DD/MM/YYYY')}`,
                start_date: fechaInicio.format('YYYY-MM-DD'),
                end_date: fechaFin.format('YYYY-MM-DD'),
                dias: Object.entries(diasPlanificados).map(([fecha, ingestas]) => ({
                    fecha: convertDateFormat(fecha), // debe devolver 'YYYY-MM-DD'
                    ingestas: ingestas.map((ing) => ({
                        intake_id: ing._id,
                    })),
                })),
            };

            // Mostrar en consola el objeto que se va a enviar
            console.log("Payload a enviar al backend:", JSON.stringify(payload, null, 2));

            const token = localStorage.getItem('refreshToken');

            const res = await fetch('http://localhost:8000/planificacion_dietas/crear_dieta/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error('Error al guardar la dieta');
            setFechaInicio(null);
            setFechaFin(null);
            setDiasPlanificados({});
            setPaso(1);
            alert('Dieta guardada con éxito');
        } catch (err) {
            console.error(err);
            alert('Hubo un error al guardar la dieta');
        }
    };

    return (
        <Dashboard>
            <Typography variant="h4" mb={2}>Crear dieta para paciente: {pacienteN}</Typography>

            <Card sx={{ p: 3, mt: 2, width: '100%' }}>

                {paso === 1 && (
                    <>
                        <Typography variant="h6" gutterBottom>Selecciona el rango de fechas</Typography>
                        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
                            <DatePicker
                                label="Fecha inicio"
                                value={fechaInicio}
                                onChange={(newValue) => setFechaInicio(newValue)}
                                format="DD/MM/YYYY"
                                sx={{ mb: 2, mt: 2 }}
                            />
                            <DatePicker
                                label="Fecha fin"
                                value={fechaFin}
                                onChange={(newValue) => setFechaFin(newValue)}
                                format="DD/MM/YYYY"
                                sx={{ mb: 2, mt: 2 }}
                            />
                        </LocalizationProvider>

                        {dietasExistentes.length > 0 && (
                            <Box sx={{ mt: 4 }}>
                                <Typography variant="h6">Dietas previas del paciente</Typography>
                                {dietasExistentes.map((dieta, idx) => (
                                    <Card key={idx} sx={{ p: 2, mt: 2 }}>
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            {dieta.nombre_dieta}
                                        </Typography>
                                        <Typography variant="body2">
                                            {dayjs(dieta.fecha_inicio).format('DD/MM/YYYY')} - {dayjs(dieta.fecha_final).format('DD/MM/YYYY')}
                                        </Typography>
                                    </Card>
                                ))}
                            </Box>
                        )}


                        <Box sx={{ mt: 3, display: 'flex', gap: 5 }}>
                            <Button
                                variant="outlined"
                                onClick={() => navigate('/planificacion_dieta/crear_dieta')}
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
                                        {ingestasDisponibles.map((ing, index) => (
                                            <Draggable key={ing._id} draggableId={ing._id} index={index}>
                                                {(provided) => (
                                                    <Box
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        sx={{
                                                            p: 1,
                                                            mb: 2,
                                                            bgcolor: 'background.paper',
                                                            border: '1px solid #ccc',
                                                            borderRadius: 1,
                                                            ...provided.draggableProps.style,
                                                        }}
                                                    >
                                                        <Typography variant="subtitle1" fontWeight="bold">{ing.intake_type}</Typography>
                                                        {Object.entries(ing.recipes).map(([tipo, recetasArray]) =>
                                                            recetasArray.length > 0 ? (
                                                                <Box key={tipo} sx={{ ml: 2, mb: 1 }}>
                                                                    {recetasArray.map((rec, i) => (
                                                                        <Typography key={i} variant="body2">
                                                                            - {rec.name}
                                                                        </Typography>
                                                                    ))}
                                                                </Box>
                                                            ) : null
                                                        )}
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
                                    <Box key={fecha} sx={{ width: 200 }}>
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
                                                            {(provided) => (
                                                                <Box
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    sx={{
                                                                        p: 1,
                                                                        mb: 1,
                                                                        bgcolor: 'background.paper',
                                                                        border: '1px solid #ccc',
                                                                        borderRadius: 1,
                                                                        ...provided.draggableProps.style,
                                                                    }}
                                                                >
                                                                    <Typography variant="subtitle2" fontWeight="bold">{ing.intake_type}</Typography>
                                                                    {Object.entries(ing.recipes).map(([tipo, recetasArray]) =>
                                                                        recetasArray.length > 0 ? (
                                                                            <Box key={tipo} sx={{ ml: 2, mb: 1 }}>
                                                                                {recetasArray.map((rec, i) => (
                                                                                    <Typography key={i} variant="body2">
                                                                                        - {rec.name}
                                                                                    </Typography>
                                                                                ))}
                                                                            </Box>
                                                                        ) : null
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
