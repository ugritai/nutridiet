import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import {
    Card, Typography, Button, Box, IconButton, FormControl, InputLabel, Select, MenuItem
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
import PorcentajeCircular from './PorcentajeCircular';
import CrearIngestaForm from './CrearIngestaForm';
import { Dialog, DialogTitle, DialogContent } from '@mui/material';
import IngestaNameForm from './IngestaNameForm';


dayjs.extend(isSameOrBefore);

const colorPorTipoIngesta = (tipo) => {
    const tipoLower = tipo?.toLowerCase();
    switch (tipoLower) {
        case 'desayuno':
            return '#fff9c4'; // amarillo claro
        case 'media mañana':
            return '#e1f5fe'; // celeste claro
        case 'almuerzo':
            return '#c8e6c9'; // verde claro
        case 'merienda':
            return '#f3e5f5'; // lila claro
        case 'cena':
            return '#ffcdd2'; // rojo claro
        default:
            return '#eeeeee'; // gris claro por defecto
    }
};


export default function CrearDietaForm() {
    const [openDialog, setOpenDialog] = useState(false);
    const [pasoIngesta, setPasoIngesta] = useState(1);
    const [datosIngestaNueva, setDatosIngestaNueva] = useState(null);

    const { pacienteN, nombreDieta } = useParams();
    const location = useLocation();
    const idDieta = location.state?.dietaId;
    const navigate = useNavigate();
    const [nutricion, setNutricion] = useState(null);
    const [fechaInicio, setFechaInicio] = useState(null);
    const [fechaFin, setFechaFin] = useState(null);

    const [paso, setPaso] = useState(1);

    useEffect(() => {
        const dietaCompleta = location.state?.dietaCompleta;

        if (!idDieta || !dietaCompleta) return;

        setFechaInicio(dayjs(dietaCompleta.start_date));
        setFechaFin(dayjs(dietaCompleta.end_date));

        const nuevoPlan = {};
        for (const dia of dietaCompleta.days) {
            const fecha = dayjs(dia.date).format('DD/MM/YYYY');
            nuevoPlan[fecha] = dia.intakes.map((ing) => {
                const detalles = ing.detalles || ing;  // fallback si no viene .detalles

                return {
                    _id: ing.intake_id || ing._id,
                    intake_name: detalles.intake_name || detalles.nombre_ingesta || 'Sin nombre',
                    intake_type: detalles.intake_type || detalles.tipo || '',
                    recipes: detalles.recipes || []
                };
            });

        }
        setDiasPlanificados(nuevoPlan);
    }, [idDieta, location.state]);


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
    const [diasPlanificados, setDiasPlanificados] = useState({});

    useEffect(() => {
        const fetchIngestas = async () => {
            try {
                const res = await fetch(`http://localhost:8000/planificacion_ingestas/ingestas/${pacienteN}`);
                if (!res.ok) throw new Error('No se pudieron cargar las ingestas');
                const data = await res.json();
                setIngestasDisponibles(data);
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

            setIngestasDisponibles(prev => [...prev, data]);
            buscadorIngestas.setQuery('');
            buscadorIngestas.setSuggestions([]);

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
                patient_name: pacienteN,
                name: `Dieta ${pacienteN} - ${fechaInicio.format('DD/MM/YYYY')} al ${fechaFin.format('DD/MM/YYYY')}`,
                start_date: fechaInicio.format('YYYY-MM-DD'),
                end_date: fechaFin.format('YYYY-MM-DD'),
                days: Object.entries(diasPlanificados)
                    .map(([fecha, ingestas]) => {
                        const fechaFormateada = dayjs(fecha, ['DD/MM/YYYY', 'YYYY-MM-DD'], true);
                        return fechaFormateada.isValid()
                            ? {
                                date: fechaFormateada.format('YYYY-MM-DD'),
                                intakes: ingestas.map((ing) => ({ intake_id: ing._id })),
                            }
                            : null;
                    })
                    .filter(Boolean),
            };

            console.log("dato enviado para guardar: ", payload);

            const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');

            const url = idDieta
                ? `http://localhost:8000/planificacion_dietas/editar_dieta/${pacienteN}/${idDieta}`
                : `http://localhost:8000/planificacion_dietas/crear_dieta/${pacienteN}`;

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

    const [filtroTipoIngesta, setFiltroTipoIngesta] = useState('');

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
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'stretch', height: '100%' }}>
                            <Box sx={{ width: '35%', display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <Typography variant="h6" gutterBottom>Confirmar creación de dieta</Typography>
                                <Typography>Desde: {fechaInicio?.format('DD/MM/YYYY')}</Typography>
                                <Typography>Hasta: {fechaFin?.format('DD/MM/YYYY')}</Typography>

                            </Box>
                            <Box sx={{ width: '65%', display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <Typography variant="h6" gutterBottom>Requerimientos diarios:</Typography>
                                <Typography>Calorías: {nutricion.kcal} kcal</Typography>
                                <Typography>Proteínas: {Number(nutricion.pro).toFixed(2)} g</Typography>
                                <Typography>Carbohidratos: {nutricion.car} g</Typography>

                            </Box>

                        </Box>

                        <DragDropContext onDragEnd={onDragEnd}>
                            {/* Contenedor FLEX horizontal */}
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'stretch', height: '100%' }}>
                                {/* Panel izquierdo: Ingestas disponibles */}
                                <Box sx={{ width: '35%', display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <Typography variant="h6" mt={1}>Ingestas disponibles</Typography>
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
                                    <FormControl size="small" sx={{ mt: 1, mb: 2, width: '100%' }}>
                                        <InputLabel>Filtrar por tipo</InputLabel>
                                        <Select
                                            label="Filtrar por tipo"
                                            value={filtroTipoIngesta}
                                            onChange={(e) => setFiltroTipoIngesta(e.target.value)}
                                        >
                                            <MenuItem value="">Todos</MenuItem>
                                            <MenuItem value="Desayuno">Desayuno</MenuItem>
                                            <MenuItem value="Media mañana">Media mañana</MenuItem>
                                            <MenuItem value="Almuerzo">Almuerzo</MenuItem>
                                            <MenuItem value="Merienda">Merienda</MenuItem>
                                            <MenuItem value="Cena">Cena</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        fullWidth
                                        onClick={() => {
                                            setPasoIngesta(1);
                                            setDatosIngestaNueva(null);
                                            setOpenDialog(true);
                                        }}
                                        sx={{ mb: 2 }}
                                    >
                                        Crear nueva ingesta
                                    </Button>

                                    <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="md">
                                        <DialogTitle>
                                            Crear nueva ingesta
                                            <IconButton
                                                onClick={() => {
                                                    setOpenDialog(false);
                                                    setPasoIngesta(1);
                                                    setDatosIngestaNueva(null);
                                                }}
                                                sx={{ position: 'absolute', right: 8, top: 8 }}
                                            >
                                                <CloseIcon />
                                            </IconButton>
                                        </DialogTitle>
                                        <DialogContent dividers>
                                            {pasoIngesta === 1 && (
                                                <IngestaNameForm
                                                    paciente={pacienteN}
                                                    onClose={(datos) => {
                                                        if (!datos) {
                                                            setOpenDialog(false);
                                                            return;
                                                        }
                                                        setDatosIngestaNueva(datos);
                                                        setPasoIngesta(2);
                                                    }}
                                                />
                                            )}

                                            {pasoIngesta === 2 && datosIngestaNueva && (
                                                <CrearIngestaForm
                                                    onClose={async () => {
                                                        setOpenDialog(false);
                                                        setPasoIngesta(1);
                                                        setDatosIngestaNueva(null);
                                                        // Recargar ingestas disponibles
                                                        try {
                                                            const res = await fetch(`http://localhost:8000/planificacion_ingestas/ingestas/${pacienteN}`);
                                                            if (!res.ok) throw new Error('No se pudieron cargar las ingestas');
                                                            const data = await res.json();
                                                            setIngestasDisponibles(data);
                                                        } catch (err) {
                                                            console.error(err);
                                                        }
                                                    }}
                                                    nombreIngesta={datosIngestaNueva.nombre}
                                                    tipo={datosIngestaNueva.tipo}
                                                />
                                            )}
                                        </DialogContent>
                                    </Dialog>

                                    <Droppable droppableId="disponibles" direction="vertical">
                                        {(provided) => (
                                            <Box
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                sx={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: 2,
                                                    p: 2,
                                                    border: '1px dashed gray',
                                                    borderRadius: 2,
                                                    minHeight: 100,
                                                    width: '100%'
                                                }}
                                            >
                                                {ingestasDisponibles
                                                    .filter((ingesta) => !filtroTipoIngesta || ingesta.intake_type === filtroTipoIngesta)
                                                    .map((ingesta, index) => {
                                                        const total = ingesta.recipes.reduce(
                                                            (acc, r) => ({
                                                                kcal: acc.kcal + (parseFloat(r.kcal) || 0),
                                                                pro: acc.pro + (parseFloat(r.pro) || 0),
                                                                car: acc.car + (parseFloat(r.car) || 0)
                                                            }),
                                                            { kcal: 0, pro: 0, car: 0 }
                                                        );

                                                        return (
                                                            <Draggable key={ingesta._id} draggableId={ingesta._id} index={index}>
                                                                {(provided) => (
                                                                    <Box
                                                                        ref={provided.innerRef}
                                                                        {...provided.draggableProps}
                                                                        {...provided.dragHandleProps}
                                                                        sx={{
                                                                            border: '1px solid #ddd',
                                                                            borderRadius: 1,
                                                                            p: 2,
                                                                            backgroundColor: colorPorTipoIngesta(ingesta.intake_type),
                                                                            boxShadow: 1,
                                                                            width: '100%',
                                                                            display: 'flex',
                                                                            flexDirection: 'column',
                                                                            gap: 1
                                                                        }}
                                                                        style={provided.draggableProps.style}
                                                                    >
                                                                        <Typography variant="subtitle1" fontWeight="bold">
                                                                            {ingesta.intake_type} - {ingesta.intake_name}
                                                                        </Typography>

                                                                        <Box sx={{ mt: 1 }}>
                                                                            {ingesta.recipes.length > 0 ? (
                                                                                <>
                                                                                    {ingesta.recipes.map((receta, i) => (
                                                                                        <Typography key={i} variant="body2" sx={{ ml: 2 }}>
                                                                                            • <strong>{receta.recipe_type}:</strong> {receta.name}
                                                                                        </Typography>
                                                                                    ))}
                                                                                    <Typography variant="caption" color="text.secondary" sx={{ ml: 2, mt: 1, display: 'block' }}>
                                                                                        Kcal: {total.kcal.toFixed(2)} | Pro: {total.pro.toFixed(2)} | Carbs: {total.car.toFixed(2)}
                                                                                    </Typography>
                                                                                </>
                                                                            ) : (
                                                                                <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                                                                                    (Sin recetas)
                                                                                </Typography>
                                                                            )}
                                                                        </Box>
                                                                    </Box>
                                                                )}
                                                            </Draggable>
                                                        );
                                                    })}
                                                {provided.placeholder}
                                            </Box>
                                        )}
                                    </Droppable>
                                </Box>

                                {/* Panel derecho: Planificación por día */}
                                <Box sx={{ width: '65%', display: 'flex', flexDirection: 'column', height: '100%' }}>
                                    <Typography variant="h6" mt={1}>Planificación por día</Typography>
                                    <Box sx={{ flexGrow: 1, display: 'flex', flexWrap: 'wrap', gap: 2, overflowY: 'auto' }}>
                                        {generarFechasPlanificacion().map((fecha, idx) => (
                                            <Box key={fecha} sx={{ width: "100%" }}>
                                                <Typography variant="subtitle1" gutterBottom>
                                                    Día {idx + 1} : {fecha}
                                                </Typography>
                                                {(() => {
                                                    const recetasDia = diasPlanificados[fecha] || [];

                                                    const total = recetasDia.reduce((acc, ing) => {
                                                        (ing.recipes || []).forEach((r) => {
                                                            acc.kcal += parseFloat(r.kcal) || 0;
                                                            acc.pro += parseFloat(r.pro) || 0;
                                                            acc.car += parseFloat(r.car) || 0;
                                                        });
                                                        return acc;
                                                    }, { kcal: 0, pro: 0, car: 0 });

                                                    return (
                                                        <Box sx={{ mb: 1, mt: 1 }}>
                                                            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                                                                Requerimientos diarios completados:
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                                                <PorcentajeCircular label="Kcal" valor={total.kcal} maximo={nutricion.kcal} />
                                                                <PorcentajeCircular label="Proteínas" valor={total.pro} maximo={nutricion.pro} />
                                                                <PorcentajeCircular label="Carbohidratos" valor={total.car} maximo={nutricion.car} />
                                                            </Box>
                                                        </Box>
                                                    );
                                                })()}
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
                                                                    {(provided, snapshot) => {
                                                                        // Calcular totales
                                                                        const total = ing.recipes?.reduce(
                                                                            (acc, r) => ({
                                                                                kcal: acc.kcal + (parseFloat(r.kcal) || 0),
                                                                                pro: acc.pro + (parseFloat(r.pro) || 0),
                                                                                car: acc.car + (parseFloat(r.car) || 0)
                                                                            }),
                                                                            { kcal: 0, pro: 0, car: 0 }
                                                                        );

                                                                        return (
                                                                            <Box
                                                                                ref={provided.innerRef}
                                                                                {...provided.draggableProps}
                                                                                {...provided.dragHandleProps}
                                                                                sx={{
                                                                                    border: '1px solid #ddd',
                                                                                    borderRadius: 1,
                                                                                    p: 2,
                                                                                    backgroundColor: colorPorTipoIngesta(ing.intake_type),
                                                                                    boxShadow: snapshot.isDragging ? 2 : 1,
                                                                                    width: '100%',
                                                                                    display: 'flex',
                                                                                    flexDirection: 'column',
                                                                                    gap: 1,
                                                                                    ...provided.draggableProps.style,
                                                                                }}
                                                                            >
                                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                                    <Typography variant="subtitle1" fontWeight="bold">
                                                                                        {ing.intake_type} - {ing.intake_name}
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

                                                                                <Box sx={{ mt: 1 }}>
                                                                                    {ing.recipes?.length > 0 ? (
                                                                                        <>
                                                                                            {ing.recipes.map((receta, i) => (
                                                                                                <Typography key={i} variant="body2" sx={{ ml: 2 }}>
                                                                                                    • <strong>{receta.recipe_type}:</strong> {receta.name}
                                                                                                </Typography>
                                                                                            ))}
                                                                                            <Typography variant="caption" color="text.secondary" sx={{ ml: 2, mt: 1, display: 'block' }}>
                                                                                                Kcal: {total.kcal.toFixed(2)} | Pro: {total.pro.toFixed(2)} | Carbs: {total.car.toFixed(2)}
                                                                                            </Typography>
                                                                                        </>
                                                                                    ) : (
                                                                                        <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                                                                                            (Sin recetas)
                                                                                        </Typography>
                                                                                    )}
                                                                                </Box>
                                                                            </Box>
                                                                        );
                                                                    }}
                                                                </Draggable>



                                                            ))}

                                                            {provided.placeholder}
                                                        </Box>
                                                    )}
                                                </Droppable>
                                            </Box>
                                        ))}
                                    </Box>
                                    {/* Aquí va tu código de planificación por día */}
                                </Box>
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
