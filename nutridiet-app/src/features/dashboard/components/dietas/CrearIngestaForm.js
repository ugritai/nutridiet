import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
    Box, Card, Typography, Button, CircularProgress, Alert,
    IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Dashboard from '../../Dashboard';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { fetchWithAuth } from '../api';
import Search from '../../components/Search';
import FoodSearch from '../../components/FoodSearch';
import PorcentajeCircular from './PorcentajeCircular';

export default function CrearIngestaForm() {
    const { pacienteN, nombreIngesta } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const tipo = location.state?.tipo || '';
    
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState(null);
    const [nutricion, setNutricion] = useState(null);
    const [recetasBuscadas, setRecetasBuscadas] = useState([]);
    const [recetasPorTipo, setRecetasPorTipo] = useState({});

    // Obtener estructura de la ingesta basada en el tipo
    const obtenerEstructuraIngesta = useCallback(() => {
        const estructuras = {
            '3 comidas': {
                Desayuno: ['primer_plato', 'bebida'],
                Almuerzo: ['entrante', 'primer_plato', 'segundo_plato', 'postre', 'bebida'],
                Cena: ['entrante', 'primer_plato', 'segundo_plato', 'postre', 'bebida'],
            },
            '5 comidas': {
                Desayuno: ['primer_plato', 'bebida'],
                'Media mañana': ['primer_plato', 'bebida'],
                Almuerzo: ['entrante', 'primer_plato', 'segundo_plato', 'postre', 'bebida'],
                Merienda: ['primer_plato', 'bebida'],
                Cena: ['entrante', 'primer_plato', 'segundo_plato', 'postre', 'bebida'],
            }
        };
        return estructuras[tipo] || {};
    }, [tipo]);

    // Inicializar estado cuando cambia el tipo
    useEffect(() => {
        if (!tipo) {
            navigate(`/planificacion_dieta/${encodeURIComponent(pacienteN)}/crear_ingesta`);
            return;
        }

        const estructura = obtenerEstructuraIngesta();
        const estadoInicial = {};
        
        Object.entries(estructura).forEach(([ingesta, subtipos]) => {
            subtipos.forEach(subtipo => {
                const key = `${ingesta}::${subtipo}`;
                estadoInicial[key] = [];
            });
        });
        
        setRecetasPorTipo(estadoInicial);
    }, [tipo, navigate, pacienteN, obtenerEstructuraIngesta]);

    // Obtener información del paciente
    useEffect(() => {
        const fetchInfoPaciente = async () => {
            try {
                const res = await fetch(`http://localhost:8000/pacientes/paciente_info/${pacienteN}`);
                if (!res.ok) throw new Error('No se pudo obtener la información del paciente');
                setNutricion(await res.json());
            } catch (err) {
                console.error(err);
            }
        };
        fetchInfoPaciente();
    }, [pacienteN]);

    // Manejar selección de receta
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
                kcal: (valores.energy_kcal / raciones).toFixed(2) || '0.00',
                pro: (valores.pro / raciones).toFixed(2) || '0.00',
                car: (valores.car / raciones).toFixed(2) || '0.00',
            };

            setRecetasBuscadas(prev => [...prev, receta]);
        } catch (err) {
            console.error(err);
        }
        buscador.setQuery('');
        buscador.setSuggestions([]);
    };

    const buscador = FoodSearch({
        type: 'recetas',
        onSelect: handleSelectReceta
    });

    // Calcular totales de nutrición
    const total = useMemo(() => {
        const sumarCampo = (arr, campo) => 
            arr.reduce((acc, r) => acc + parseFloat(r[campo] || 0), 0);

        const resultado = { kcal: 0, pro: 0, car: 0 };

        Object.values(recetasPorTipo).forEach(recetasArray => {
            resultado.kcal += sumarCampo(recetasArray, 'kcal');
            resultado.pro += sumarCampo(recetasArray, 'pro');
            resultado.car += sumarCampo(recetasArray, 'car');
        });

        return {
            kcal: resultado.kcal.toFixed(2),
            pro: resultado.pro.toFixed(2),
            car: resultado.car.toFixed(2),
        };
    }, [recetasPorTipo]);

    // Manejar drag and drop
    const onDragEnd = useCallback((result) => {
        const { source, destination } = result;
        if (!destination) return;

        const estructura = obtenerEstructuraIngesta();
        const validDroppables = new Set(['searchResults']);
        
        Object.entries(estructura).forEach(([ingesta, subtipos]) => {
            subtipos.forEach(subtipo => validDroppables.add(`${ingesta}::${subtipo}`));
        });

        if (!validDroppables.has(source.droppableId) || !validDroppables.has(destination.droppableId)) {
            console.warn("Droppable inválido:", source.droppableId, destination.droppableId);
            return;
        }

        const getDraggedItem = () => {
            return source.droppableId === 'searchResults' 
                ? recetasBuscadas[source.index] 
                : recetasPorTipo[source.droppableId]?.[source.index];
        };

        const draggedItem = getDraggedItem();
        if (!draggedItem) return;

        // Función para actualizar el estado según el tipo de movimiento
        const updateState = (sourceId, destId, item) => {
            // De buscador a tipo
            if (sourceId === 'searchResults' && destId !== 'searchResults') {
                if (recetasPorTipo[destId]?.some(r => r.nombre === item.nombre)) return;
                
                setRecetasBuscadas(prev => prev.filter((_, i) => i !== source.index));
                setRecetasPorTipo(prev => ({
                    ...prev,
                    [destId]: [...(prev[destId] || []), item]
                }));
            }
            // De tipo a buscador
            else if (sourceId !== 'searchResults' && destId === 'searchResults') {
                setRecetasPorTipo(prev => ({
                    ...prev,
                    [sourceId]: prev[sourceId].filter((_, i) => i !== source.index)
                }));
                setRecetasBuscadas(prev => [...prev, item]);
            }
            // Entre tipos diferentes
            else if (sourceId !== destId) {
                const sourceItems = [...(recetasPorTipo[sourceId] || [])];
                const destItems = [...(recetasPorTipo[destId] || [])];
                
                if (destItems.some(r => r.nombre === item.nombre)) return;
                
                sourceItems.splice(source.index, 1);
                destItems.splice(destination.index, 0, item);
                
                setRecetasPorTipo(prev => ({
                    ...prev,
                    [sourceId]: sourceItems,
                    [destId]: destItems
                }));
            }
            // Reordenar dentro de la misma lista
            else {
                const items = sourceId === 'searchResults'
                    ? [...recetasBuscadas]
                    : [...(recetasPorTipo[sourceId] || [])];
                
                const [moved] = items.splice(source.index, 1);
                items.splice(destination.index, 0, moved);
                
                if (sourceId === 'searchResults') {
                    setRecetasBuscadas(items);
                } else {
                    setRecetasPorTipo(prev => ({
                        ...prev,
                        [sourceId]: items
                    }));
                }
            }
        };

        updateState(source.droppableId, destination.droppableId, draggedItem);
    }, [recetasBuscadas, recetasPorTipo, obtenerEstructuraIngesta]);

    // Normalizar recetas para el envío al backend
    const normalizeRecipes = useCallback((recipesPorTipo) => {
        const normalized = {};
        for (const tipo in recipesPorTipo) {
            normalized[tipo] = recipesPorTipo[tipo].map(receta => ({
                name: receta.nombre,
                kcal: parseFloat(receta.kcal),
                pro: parseFloat(receta.pro),
                car: parseFloat(receta.car),
            }));
        }
        return normalized;
    }, []);

    // Enviar formulario
    const handleSubmit = async (e) => {
        e.preventDefault();
        setEnviando(true);
        setError(null);
        
        try {
            const body = {
                intake_type: tipo,
                recipes: normalizeRecipes(recetasPorTipo)
            };
            
            const res = await fetchWithAuth(
                `/planificacion_ingestas/crear_ingesta/${pacienteN}`, 
                {
                    method: 'POST',
                    body: JSON.stringify(body),
                }
            );

            if (!res.ok) throw new Error('Error al crear la ingesta');
            
            // Resetear estado después de éxito
            setRecetasPorTipo({});
            setRecetasBuscadas([]);
            alert('Ingesta creada correctamente');
        } catch (err) {
            setError(err.message);
        } finally {
            setEnviando(false);
        }
    };

    // Renderizado condicional para evitar errores
    if (!tipo) return null;

    return (
        <Dashboard>
            <Card sx={{ p: 3, mt: 2, width: '100%' }}>
                {nutricion && (
                    <Box sx={{ display: 'flex', gap: 3, mb: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: { md: 1 }, maxWidth: { md: '33.3333%' } }}>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                Nombre de Ingesta:
                            </Typography>
                            <Typography>{nombreIngesta}</Typography>

                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                Requerimientos diarios:
                            </Typography>
                            <Typography>Calorías: {nutricion.kcal} kcal</Typography>
                            <Typography>Proteínas: {Number(nutricion.pro).toFixed(2)} g</Typography>
                            <Typography>Carbohidratos: {nutricion.car} g</Typography>
                        </Box>

                        <Box sx={{ 
                            maxWidth: { md: '66.6666%' },
                            display: 'flex',
                            gap: 2,
                            alignItems: 'center',
                            flexWrap: 'wrap',
                        }}>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ width: '100%' }}>
                                Requerimientos completado:
                            </Typography>
                            <PorcentajeCircular 
                                label="Kcal" 
                                valor={parseFloat(total.kcal)} 
                                maximo={nutricion.kcal} 
                            />
                            <PorcentajeCircular 
                                label="Proteínas" 
                                valor={parseFloat(total.pro)} 
                                maximo={nutricion.pro} 
                            />
                            <PorcentajeCircular 
                                label="Carbohidratos" 
                                valor={parseFloat(total.car)} 
                                maximo={nutricion.car} 
                            />
                        </Box>
                    </Box>
                )}

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <form onSubmit={handleSubmit}>
                    <DragDropContext onDragEnd={onDragEnd}>
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, mt: 2 }}>
                            {/* Columna izquierda: Buscador */}
                            <Box sx={{ 
                                flex: { md: 1 },
                                maxWidth: { md: '33.3333%' },
                                border: '1px dashed gray',
                                borderRadius: 2,
                                p: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2,
                                backgroundColor: '#fafafa',
                            }}>
                                <Search
                                    value={buscador.query}
                                    onChange={(val) => {
                                        buscador.setQuery(val);
                                        buscador.handleSuggestions(val);
                                    }}
                                    onSubmit={(val) => {
                                        handleSelectReceta(val);
                                        buscador.setQuery('');
                                        buscador.setSuggestions([]);
                                    }}
                                    suggestions={buscador.suggestions}
                                    placeholder="Buscar receta"
                                    suggestionClick={handleSelectReceta}
                                    showButton={false}
                                />

                                <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                                    <Typography variant="h6">Resultados por búsqueda</Typography>
                                    <Droppable droppableId="searchResults">
                                        {(provided) => (
                                            <Box
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                sx={{
                                                    maxHeight: '1000px',
                                                    overflowY: 'auto',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: 2,
                                                    border: '1px solid #ccc',
                                                    borderRadius: 1,
                                                    p: 1,
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
                                                                    sx={{ p: 2, minHeight: '80px' }}
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
                                </Box>
                            </Box>

                            {/* Columna derecha: Estructura de la ingesta */}
                            <Box sx={{ flex: { md: 2 }, maxWidth: { md: '66.6666%' } }}>
                                <Typography variant="h6" gutterBottom>
                                    Tipo de Ingesta: {tipo}
                                </Typography>

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {Object.entries(obtenerEstructuraIngesta()).map(([ingesta, subtipos]) => (
                                        <Box key={ingesta}>
                                            <Typography variant="h5" sx={{ mb: 2 }}>
                                                {ingesta}
                                            </Typography>

                                            <Box sx={{
                                                display: 'grid',
                                                gap: 2,
                                                gridTemplateColumns: {
                                                    xs: '1fr',
                                                    sm: 'repeat(2, 1fr)',
                                                    md: 'repeat(3, 1fr)',
                                                    lg: 'repeat(5, 1fr)',
                                                },
                                            }}>
                                                {subtipos.map((subtipo) => {
                                                    const id = `${ingesta}::${subtipo}`;
                                                    
                                                    return (
                                                        <Droppable key={id} droppableId={id}>
                                                            {(provided) => (
                                                                <Box
                                                                    ref={provided.innerRef}
                                                                    {...provided.droppableProps}
                                                                    sx={{
                                                                        p: 2,
                                                                        border: '1px solid #ccc',
                                                                        borderRadius: 2,
                                                                        minHeight: 200,
                                                                        backgroundColor: '#fafafa',
                                                                    }}
                                                                >
                                                                    <Typography variant="h6" gutterBottom>
                                                                        {subtipo.replace('_', ' ').toUpperCase()}
                                                                    </Typography>

                                                                    {(recetasPorTipo[id] || []).map((receta, i) => (
                                                                        <Draggable
                                                                            key={`${receta.nombre}::${id}`}
                                                                            draggableId={`${receta.nombre}::${id}`}
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
                                                                                            onClick={() => setRecetasPorTipo(prev => ({
                                                                                                ...prev,
                                                                                                [id]: prev[id].filter(r => r.nombre !== receta.nombre),
                                                                                            }))}
                                                                                        >
                                                                                            <CloseIcon />
                                                                                        </IconButton>
                                                                                    </Box>
                                                                                </Card>
                                                                            )}
                                                                        </Draggable>
                                                                    ))}
                                                                    {provided.placeholder}
                                                                </Box>
                                                            )}
                                                        </Droppable>
                                                    );
                                                })}
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </Box>

                        <Box sx={{ mt: 3, display: 'flex', gap: 5 }}>
                            <Button 
                                variant="outlined" 
                                onClick={() => navigate(`/planificacion_dieta/${encodeURIComponent(pacienteN)}/crear_ingesta`)}
                            >
                                Atrás
                            </Button>
                            <Button 
                                type="submit" 
                                variant="contained" 
                                color="primary" 
                                disabled={enviando}
                            >
                                {enviando ? <CircularProgress size={24} /> : 'Crear Ingesta'}
                            </Button>
                        </Box>
                    </DragDropContext>
                </form>
            </Card>
        </Dashboard>
    );
}