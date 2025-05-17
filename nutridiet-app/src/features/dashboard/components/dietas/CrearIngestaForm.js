import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Box, Card, Typography, TextField, Button, MenuItem, CircularProgress, Alert,
    FormControl, FormLabel, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Dashboard from '../../Dashboard';
import Search from '../../components/Search';
import FoodSearch from '../../components/FoodSearch';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const subtipos = ['entrante', 'primer_plato', 'segundo_plato', 'postre', 'bebida'];
const tiposIngesta = ['Desayuno', 'Media mañana', 'Almuerzo', 'Merienda', 'Cena', 'Snack'];

export default function CrearIngestaForm() {
    const { pacienteN } = useParams();
    const [formData, setFormData] = useState({ tipo: '' });
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState(null);
    const [mensaje, setMensaje] = useState(null);
    const [nutricion, setNutricion] = useState(null);
    const [recetasPorTipo, setRecetasPorTipo] = useState({
        primer_plato: [],
        segundo_plato: [],
        postre: [],
        bebida: [],
        entrante: [],
    });

    const buscador = FoodSearch({
        type: 'recetas',
        onSelect: () => { }
    });

    const [recetasBuscadas, setRecetasBuscadas] = useState([]);

    useEffect(() => {
        const fetchInfoPaciente = async () => {
            try {
                const res = await fetch(`http://localhost:8000/pacientes/paciente_info/${pacienteN}`);
                console.log('Data received:', pacienteN);
                if (!res.ok) throw new Error('No se pudo obtener la información del paciente');
                const data = await res.json();
                setNutricion(data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchInfoPaciente();
    }, [pacienteN]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSelectReceta = async (nombre) => {
        if (recetasBuscadas.some(r => r.nombre === nombre)) return;

        try {
            const res = await fetch(`http://localhost:8000/recetas/${encodeURIComponent(nombre)}/nutricion`);
            if (!res.ok) throw new Error('No se pudo obtener la nutrición de la receta');
            const data = await res.json();
            const raciones = data.raciones || 1;
            const valores = data.valores_nutricionales;

            const receta = {
                id: nombre,
                nombre,
                kcal: valores.energy_kcal ? (valores.energy_kcal / raciones).toFixed(2) : '0.00',
                pro: valores.pro ? (valores.pro / raciones).toFixed(2) : '0.00',
                car: valores.car ? (valores.car / raciones).toFixed(2) : '0.00',
            };

            setRecetasBuscadas(prev => [...prev, receta]);
        } catch (err) {
            console.error(err);
        }

        buscador.setQuery('');
        buscador.setSuggestions([]);
    };
    console.log('Render droppable searchResults, recetasBuscadas:', recetasBuscadas.length);

    const onDragEnd = (result) => {
        console.log("DRAG RESULT:", result);
        const { source, destination, draggableId } = result;
        if (!destination) return;

        const validDroppables = ['searchResults', ...subtipos];
        if (!validDroppables.includes(source.droppableId) || !validDroppables.includes(destination.droppableId)) {
            console.warn("Droppable inválido:", source.droppableId, destination.droppableId);
            return;
        }

        // Extraer nombre de receta desde draggableId
        const recetaNombre = draggableId.split('::')[0];

        let draggedItem;
        if (source.droppableId === 'searchResults') {
            draggedItem = recetasBuscadas[source.index];
        } else {
            draggedItem = recetasPorTipo[source.droppableId][source.index];
        }

        // Caso 1: de buscador a tipo
        if (source.droppableId === 'searchResults' && destination.droppableId !== 'searchResults') {
            if (recetasPorTipo[destination.droppableId].some(r => r.nombre === draggedItem.nombre)) return;

            setRecetasBuscadas(prev => prev.filter((_, i) => i !== source.index));
            setRecetasPorTipo(prev => ({
                ...prev,
                [destination.droppableId]: [...prev[destination.droppableId], draggedItem]
            }));
        }

        // Caso 2: de tipo a buscador
        else if (source.droppableId !== 'searchResults' && destination.droppableId === 'searchResults') {
            const newSource = [...recetasPorTipo[source.droppableId]];
            newSource.splice(source.index, 1);

            setRecetasPorTipo(prev => ({
                ...prev,
                [source.droppableId]: newSource
            }));
            setRecetasBuscadas(prev => [...prev, draggedItem]);
        }

        // Caso 3: entre tipos
        else if (source.droppableId !== destination.droppableId) {
            const newSource = [...recetasPorTipo[source.droppableId]];
            const newDest = [...recetasPorTipo[destination.droppableId]];
            const [removed] = newSource.splice(source.index, 1);

            if (!newDest.some(r => r.nombre === removed.nombre)) {
                newDest.push(removed);
                setRecetasPorTipo(prev => ({
                    ...prev,
                    [source.droppableId]: newSource,
                    [destination.droppableId]: newDest
                }));
            }
        }

        // Caso 4: reordenar dentro de la misma lista
        else {
            const list = source.droppableId === 'searchResults'
                ? [...recetasBuscadas]
                : [...recetasPorTipo[source.droppableId]];

            const [removed] = list.splice(source.index, 1);
            list.splice(destination.index, 0, removed);

            if (source.droppableId === 'searchResults') {
                setRecetasBuscadas(list);
            } else {
                setRecetasPorTipo(prev => ({
                    ...prev,
                    [source.droppableId]: list
                }));
            }
        }
    };

    const sumarCampo = (arr, campo) => {
        return arr.reduce((acc, r) => acc + parseFloat(r[campo] || 0), 0).toFixed(2);
    };

    const calcularTotales = () => {
        const total = { kcal: 0, pro: 0, car: 0 };
        for (const tipo of subtipos) {
            total.kcal += parseFloat(sumarCampo(recetasPorTipo[tipo], 'kcal'));
            total.pro += parseFloat(sumarCampo(recetasPorTipo[tipo], 'pro'));
            total.car += parseFloat(sumarCampo(recetasPorTipo[tipo], 'car'));
        }
        return {
            kcal: total.kcal.toFixed(2),
            pro: total.pro.toFixed(2),
            car: total.car.toFixed(2),
        };
    };

    function normalizeRecipes(recipesPorTipo) {
        const normalized = {};
        for (const tipo in recipesPorTipo) {
            normalized[tipo] = recipesPorTipo[tipo].map(receta => ({
                name: receta.nombre,  // usar 'name'
                kcal: parseFloat(receta.kcal),  // convertir a float
                pro: parseFloat(receta.pro),
                car: parseFloat(receta.car),
            }));
        }
        return normalized;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setEnviando(true);
        setError(null);
        setMensaje(null);
        try {
            const token = localStorage.getItem('refreshToken');
            const body = {
                intake_type: formData.tipo,
                recipes: normalizeRecipes(recetasPorTipo)
            };
            const res = await fetch(`http://localhost:8000/planificacion_dietas/crear_ingesta/${pacienteN}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });
            console.log(JSON.stringify(body, null, 2));

            if (!res.ok) throw new Error('Error al crear la ingesta');
            setMensaje('Ingesta creada correctamente');
            setFormData({ intake_type: '' });
            setRecetasPorTipo({ entrante: [], primer_plato: [], segundo_plato: [], postre: [], bebida: [] });
            setRecetasBuscadas([]);
        } catch (err) {
            setError(err.message);
        } finally {
            setEnviando(false);
        }
    };

    const total = calcularTotales();

    return (
        <Dashboard>
            <Typography variant="h4">Crear Ingesta para paciente: {pacienteN}</Typography>
            <Card sx={{ p: 3, mt: 2, width: '100%' }}>
                {nutricion && (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle1"><strong>Requerimientos diarios:</strong></Typography>
                        <Typography>Calorías: {nutricion.kcal} kcal</Typography>
                        <Typography>Proteínas: {Number(nutricion.pro).toFixed(2)} g</Typography>
                        <Typography>Carbohidratos: {nutricion.car} g</Typography>
                    </Box>
                )}

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                {mensaje && <Alert severity="success" sx={{ mb: 2 }}>{mensaje}</Alert>}

                <form onSubmit={handleSubmit}>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <FormLabel>Tipo de Ingesta</FormLabel>
                        <TextField select name="tipo" value={formData.tipo} onChange={handleChange} required>
                            {tiposIngesta.map((tipo) => (
                                <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>
                            ))}
                        </TextField>
                    </FormControl>

                    <Search
                        value={buscador.query}
                        onChange={(val) => {
                            buscador.setQuery(val);
                            buscador.handleSuggestions(val);
                        }}
                        onSubmit={(val) => handleSelectReceta(val)}
                        suggestions={buscador.suggestions}
                        placeholder="Buscar receta"
                        suggestionClick={handleSelectReceta}
                    />

                    <DragDropContext onDragEnd={onDragEnd}>
                        <Box sx={{ mt: 2 }}>
                            {/* Zona de resultados de búsqueda */}
                            <Droppable droppableId="searchResults" direction="horizontal">
                                {(provided, snapshot) => (
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
                                            backgroundColor: snapshot.isDraggingOver ? '#e3f2fd' : 'transparent'
                                        }}
                                    >
                                        {recetasBuscadas.length === 0 ? (
                                            <Typography variant="body2" color="textSecondary" sx={{ m: 'auto' }}>
                                                No hay recetas buscadas
                                            </Typography>
                                        ) : (
                                            recetasBuscadas.map((receta, i) => (
                                                <Draggable
                                                    key={`${receta.nombre}::searchResults`}
                                                    draggableId={`${receta.nombre}::searchResults`}
                                                    index={i}
                                                >
                                                    {(provided) => (
                                                        <Card
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            sx={{ p: 2, width: 200 }}
                                                        >
                                                            <Typography>{receta.nombre}</Typography>
                                                            <Typography variant="body2">
                                                                Kcal: {receta.kcal} | Pro: {receta.pro} | Carbs: {receta.car}
                                                            </Typography>
                                                        </Card>
                                                    )}
                                                </Draggable>
                                            ))
                                        )}
                                        {provided.placeholder}
                                    </Box>
                                )}
                            </Droppable>

                            {/* Subtipos */}
                            <Box
                                sx={{
                                    display: 'grid',
                                    gap: 2,
                                    gridTemplateColumns: {
                                        xs: '1fr',          // en pantallas xs (extra small, <600px) 1 columna
                                        sm: 'repeat(2, 1fr)', // en pantallas sm (≥600px) 2 columnas (opcional, más responsive)
                                        md: 'repeat(3, 1fr)', // en pantallas md (≥900px) 3 columnas (opcional)
                                        lg: 'repeat(5, 1fr)', // en pantallas lg (≥1200px) 5 columnas (tu diseño original)
                                    },
                                }}
                            >

                                {subtipos.map((tipo) => (
                                    <Droppable key={tipo} droppableId={tipo}>
                                        {(provided) => (
                                            <Box
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                sx={{ p: 2, border: '1px solid #ccc', borderRadius: 2, minHeight: 200 }}
                                            >
                                                <Typography variant="h6" gutterBottom>
                                                    {tipo.replace('_', ' ').toUpperCase()}
                                                </Typography>
                                                {recetasPorTipo[tipo]?.map((receta, i) => (
                                                    <Draggable
                                                        key={`${receta.nombre}::${tipo}`}
                                                        draggableId={`${receta.nombre}::${tipo}`}
                                                        index={i}
                                                    >
                                                        {(provided) => (
                                                            <Card
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                sx={{ p: 1, mb: 1 }}
                                                            >
                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                    <Box>
                                                                        <Typography>{receta.nombre}</Typography>
                                                                        <Typography variant="body2">
                                                                            Kcal: {receta.kcal} | Pro: {receta.pro} | Carbs: {receta.car}
                                                                        </Typography>
                                                                    </Box>
                                                                    <IconButton
                                                                        onClick={() =>
                                                                            setRecetasPorTipo(prev => ({
                                                                                ...prev,
                                                                                [tipo]: prev[tipo].filter(r => r.nombre !== receta.nombre),
                                                                            }))
                                                                        }
                                                                    >
                                                                        <CloseIcon />
                                                                    </IconButton>
                                                                </Box>
                                                            </Card>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                                {recetasPorTipo[tipo]?.length > 0 && (
                                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                                        Total: Kcal {sumarCampo(recetasPorTipo[tipo], 'kcal')} |
                                                        Pro {sumarCampo(recetasPorTipo[tipo], 'pro')} |
                                                        Carbs {sumarCampo(recetasPorTipo[tipo], 'car')}
                                                    </Typography>
                                                )}
                                            </Box>
                                        )}
                                    </Droppable>
                                ))}
                            </Box>

                            {/* Totales globales */}
                            <Box sx={{ mt: 3, p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
                                <Typography variant="h6">Totales</Typography>
                                <Typography>
                                    Kcal: {total.kcal} | Proteínas: {total.pro} g | Carbohidratos: {total.car} g
                                </Typography>

                                {nutricion && (
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                        <strong>Porcentaje de requerimientos diarios cubiertos:</strong><br />
                                        Kcal: {(total.kcal / nutricion.kcal * 100).toFixed(1)}% |
                                        Proteínas: {(total.pro / nutricion.pro * 100).toFixed(1)}% |
                                        Carbohidratos: {(total.car / nutricion.car * 100).toFixed(1)}%
                                    </Typography>
                                )}
                            </Box>

                        </Box>
                    </DragDropContext>

                    <Box sx={{ mt: 3 }}>
                        <Button type="submit" variant="contained" color="primary" disabled={enviando}>
                            {enviando ? <CircularProgress size={24} /> : 'Crear Ingesta'}
                        </Button>
                    </Box>
                </form>
            </Card>
        </Dashboard>
    );
}
