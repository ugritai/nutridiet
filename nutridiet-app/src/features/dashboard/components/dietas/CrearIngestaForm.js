import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
    Box, Card, Typography, Button, CircularProgress, Alert, FormControl, InputLabel, Select, MenuItem, Slider, FormControlLabel, Checkbox
} from '@mui/material';
import Dashboard from '../../Dashboard';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { fetchWithAuth } from '../api';
import Search from '../../components/Search';
import FoodSearch from '../../components/FoodSearch';
import PorcentajeCircular from './PorcentajeCircular';
import { obtenerEstructuraIngesta } from './ingestas/EstructuraIngestas';
import TipoIngestaGrid from './ingestas/TipoIngestaGrid';
import RecetaCard from './ingestas/RecetaCard';

const porcentajeEsperadoPorTipo = {
    desayuno: 0.20,
    'media mañana': 0.075,
    almuerzo: 0.30,
    merienda: 0.075,
    cena: 0.275
};


export default function CrearIngestaForm({ onClose = null, nombreIngesta: propNombre, tipo: propTipo }) {
    const isDialogMode = typeof onClose === 'function';
    const location = useLocation();
  
    const modoEdicion = location.state?.modo === 'editar';
    const ingestaOriginal = location.state?.ingesta || null;
  
    const nombreIngesta = modoEdicion
      ? ingestaOriginal?.nombre || ''
      : propNombre || useParams().nombreIngesta;
  
    const tipo = modoEdicion
      ? ingestaOriginal?.tipo || ''
      : propTipo || location.state?.tipo || '';
  

    const { pacienteN } = useParams();
    const navigate = useNavigate();

    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState(null);
    const [nutricion, setNutricion] = useState(null);
    const [recetasBuscadas, setRecetasBuscadas] = useState([]);
    const [recetasPorTipo, setRecetasPorTipo] = useState({});
    const [recetasFiltradas, setRecetasFiltradas] = useState([]);
    const [categoriaFiltro, setCategoriaFiltro] = useState('');
    const [loading, setLoading] = useState(false);
    const [ingestaUniversal, setIngestaUniversal] = useState(false);


    const [filtrosNutricionales, setFiltrosNutricionales] = useState({
        kcal: [0, 1000],
        pro: [0, 100],
        car: [0, 100]
    });
    const [maximosNutricionales, setMaximosNutricionales] = useState({
        kcal: 1000,
        pro: 100,
        car: 100
    });

    useEffect(() => {
        console.log('modoEdicion:', modoEdicion);
        console.log('ingestaOriginal?.recipes:', ingestaOriginal?.recipes);
        console.log('tipo:', tipo);
        if (modoEdicion && ingestaOriginal?.recipes && tipo) {
            const transformadas = {};

            console.log('Ejecutando useEffect edición');
            console.log('tipo:', tipo);
            console.log('recipes:', ingestaOriginal.recipes);

            ingestaOriginal.recipes.forEach(receta => {
                const subtipo = (receta.recipe_type || 'desconocido').toLowerCase();
                const key = `${tipo.toLowerCase()}::${subtipo}`;
                if (!transformadas[key]) transformadas[key] = [];
                transformadas[key].push({
                    ...receta,
                    nombre: receta.name || 'Sin nombre',
                    kcal: receta.kcal ?? 0,
                    pro: receta.pro ?? 0,
                    car: receta.car ?? 0
                });
            });

            console.log('recetasPorTipo final:', transformadas);
            setRecetasPorTipo(transformadas);
            setIngestaUniversal(ingestaOriginal.ingesta_universal || false);
        }
    }, [modoEdicion, ingestaOriginal, tipo]);


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

    const handleSelectReceta = async (nombre) => {
        if (recetasBuscadas.some(r => r.nombre === nombre)) return;
        try {
            const res = await fetch(`http://localhost:8000/recetas/${encodeURIComponent(nombre)}/nutricion`);
            if (!res.ok) throw new Error('No se pudo obtener la nutrición de la receta');
            const data = await res.json();
            const raciones = data.raciones || 1;
            const valores = data.nutritional_info;
            const receta = {
                id: data._id,
                name: nombre,
                kcal: (valores.energy_kcal / raciones).toFixed(2),
                pro: (valores.pro / raciones).toFixed(2),
                car: (valores.car / raciones).toFixed(2),
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
        onSelect: (item) => {
            const nombre = typeof item === 'string' ? item : item?.value || item?.label;
            handleSelectReceta(nombre);
        }
    });

    const total = useMemo(() => {
        const sumarCampo = (arr, campo) =>
            (arr || [])
                .filter(r => r && typeof r[campo] !== 'undefined')
                .reduce((acc, r) => acc + parseFloat(r[campo]), 0);

        const resultado = { kcal: 0, pro: 0, car: 0 };
        Object.values(recetasPorTipo || {}).forEach(arr => {
            resultado.kcal += sumarCampo(arr, 'kcal');
            resultado.pro += sumarCampo(arr, 'pro');
            resultado.car += sumarCampo(arr, 'car');
        });

        return {
            kcal: resultado.kcal.toFixed(2),
            pro: resultado.pro.toFixed(2),
            car: resultado.car.toFixed(2),
        };
    }, [recetasPorTipo]);

    useEffect(() => {
        if (!categoriaFiltro) {
            setRecetasFiltradas([]);
            return;
        }

        const fetchDatos = async () => {
            setLoading(true);
            try {
                const [recetasRes, maximosRes] = await Promise.all([
                    fetch(`http://localhost:8000/recetas/categoria/${encodeURIComponent(categoriaFiltro)}/nutricion_simplificada?por_porcion=true`),
                    fetch(`http://localhost:8000/recetas/recetas/maximos_nutricionales?categoria=${encodeURIComponent(categoriaFiltro)}`)
                ]);

                if (!recetasRes.ok) throw new Error('Error al obtener recetas');
                if (!maximosRes.ok) throw new Error('Error al obtener valores máximos');

                const recetasData = await recetasRes.json();
                const maximosData = await maximosRes.json();

                const recetasConDatos = recetasData.resultados || [];
                console.log(recetasConDatos);
                setRecetasFiltradas(recetasConDatos);

                setMaximosNutricionales({
                    kcal: maximosData.kcal || 1000,
                    pro: maximosData.pro || 100,
                    car: maximosData.car || 100
                });

                setFiltrosNutricionales({
                    kcal: [0, maximosData.kcal || 1000],
                    pro: [0, maximosData.pro || 100],
                    car: [0, maximosData.car || 100]
                });
            } catch (err) {
                console.error('Error al obtener recetas por categoría:', err);
                setRecetasFiltradas([]);
            } finally {
                setLoading(false);
            }
        };

        fetchDatos();
    }, [categoriaFiltro]);

    const onDragEnd = useCallback((resultado) => {
        const { source, destination, draggableId } = resultado;

        if (!destination || !draggableId) return;

        const estructura = obtenerEstructuraIngesta(tipo);
        const validDroppables = new Set(['searchResults', 'categoriaResults']);
        Object.entries(estructura).forEach(([ingesta, subtipos]) => {
            subtipos.forEach(subtipo => validDroppables.add(`${ingesta}::${subtipo}`));
        });

        // Si el drop ocurre fuera de zonas válidas, ignorar
        if (!validDroppables.has(source.droppableId) || !validDroppables.has(destination.droppableId)) return;

        // Obtener la receta correspondiente al ID
        const todasLasRecetas = [
            ...recetasBuscadas,
            ...recetasFiltradas,
            ...Object.values(recetasPorTipo).flat()
        ];
        const item = todasLasRecetas.find(r => r.id === draggableId);
        if (!item) return;

        const updateState = (sourceId, destId, item) => {
            // 1. De búsqueda a tipo
            if (sourceId === 'searchResults' && destId !== 'searchResults') {
                if (recetasPorTipo[destId]?.some(r => r.id === item.id)) return;
                setRecetasBuscadas(prev => prev.filter(r => r.id !== item.id));
                setRecetasPorTipo(prev => ({
                    ...prev,
                    [destId]: [...(prev[destId] || []), item]
                }));
            }

            // 2. De categoría a tipo
            else if (sourceId === 'categoriaResults' && destId !== 'categoriaResults') {
                if (recetasPorTipo[destId]?.some(r => r.id === item.id)) return;
                setRecetasPorTipo(prev => ({
                    ...prev,
                    [destId]: [...(prev[destId] || []), item]
                }));
            }

            // 3. Entre zonas de subtipo (por ejemplo, mover entre "desayuno::primer plato" a "cena::postre")
            else if (sourceId !== destId) {
                const sourceItems = [...(recetasPorTipo[sourceId] || [])];
                const destItems = [...(recetasPorTipo[destId] || [])];
                if (destItems.some(r => r.id === item.id)) return;

                const filtrados = sourceItems.filter(r => r.id !== item.id);
                destItems.splice(destination.index, 0, item);

                setRecetasPorTipo(prev => ({
                    ...prev,
                    [sourceId]: filtrados,
                    [destId]: destItems
                }));
            }

            // 4. Reordenar dentro de la misma zona
            else if (sourceId === destId) {
                const items = [...(recetasPorTipo[sourceId] || [])];
                const [moved] = items.splice(source.index, 1);
                items.splice(destination.index, 0, moved);
                setRecetasPorTipo(prev => ({
                    ...prev,
                    [sourceId]: items
                }));
            }
        };

        updateState(source.droppableId, destination.droppableId, item);
    }, [recetasBuscadas, recetasFiltradas, recetasPorTipo, tipo]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setEnviando(true);
        setError(null);

        try {
            const formatear = (str) =>
                str
                    .split('_')
                    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
                    .join(' ');

            const recetasUnificadas = [];

            Object.entries(recetasPorTipo).forEach(([key, recetasLista]) => {
                if (!recetasLista || recetasLista.length === 0) return;

                const [, subtipo] = key.split('::');
                const tipoReceta = formatear(subtipo);

                recetasLista.forEach((receta) => {
                    recetasUnificadas.push({
                        id: receta.id,
                        recipe_type: tipoReceta,
                        name: receta.name,
                        kcal: parseFloat(receta.kcal),
                        pro: parseFloat(receta.pro),
                        car: parseFloat(receta.car),
                    });
                });
            });

            if (recetasUnificadas.length === 0) {
                setError("Debes añadir al menos una receta.");
                return;
            }

            const cuerpo = {
                intake_type: formatear(tipo),
                intake_name: nombreIngesta,
                intake_universal: ingestaUniversal,
                recipes: recetasUnificadas,
            };
            console.log(cuerpo)

            const url = modoEdicion
                ? `/planificacion_ingestas/editar_ingesta/${pacienteN}/${encodeURIComponent(cuerpo.intake_name)}`
                : `/planificacion_ingestas/crear_ingesta/${pacienteN}`;

            const method = modoEdicion ? 'PUT' : 'POST';

            const res = await fetchWithAuth(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cuerpo),
            });

            if (!res.ok) throw new Error(`Error al guardar la ingesta`);

            setRecetasPorTipo({});
            setRecetasBuscadas([]);
            alert('Ingesta guardada correctamente');
            if (isDialogMode) {
                onClose(); // cerrar diálogo si está en modo modal
            } else {
                navigate(`/planificacion_dieta/${encodeURIComponent(pacienteN)}`);
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setEnviando(false);
        }
    };

    if (!tipo) return null;

    const contenido = (
<Card sx={{ p: 3, mt: 2, width: '100%' }}>
                {nutricion && (
                    <Box sx={{ display: 'flex', gap: 3, mb: 2, flexWrap: 'wrap' }}>
                        <Box sx={{ flex: { md: 1 }, maxWidth: { md: '60.9999%' } }}>
                            <Typography variant="subtitle1" fontWeight="bold">Nombre de Ingesta:</Typography>
                            <Typography>{nombreIngesta}</Typography>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Requerimientos diarios:</Typography>
                            <Typography>Calorías: {nutricion.kcal} kcal</Typography>
                            <Typography>Proteínas: {Number(nutricion.pro).toFixed(2)} g</Typography>
                            <Typography>Carbohidratos: {nutricion.car} g</Typography>
                        </Box>
                        <Box sx={{ maxWidth: { md: '39.9999%' }, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                            {(() => {
                                const tipoNorm = tipo.toLowerCase();
                                const porcentaje = porcentajeEsperadoPorTipo[tipoNorm] || 1;

                                const kcalObjetivo = nutricion.kcal * porcentaje;
                                const proObjetivo = nutricion.pro * porcentaje;
                                const carObjetivo = nutricion.car * porcentaje;

                                return (
                                    <>
                                        <Typography variant="subtitle1" fontWeight="bold" sx={{ width: '100%' }}>
                                            Requerimientos completados ({(porcentaje * 100).toFixed(0)}%):
                                        </Typography>
                                        <PorcentajeCircular label="Kcal" valor={parseFloat(total.kcal)} maximo={kcalObjetivo} />
                                        <PorcentajeCircular label="Proteínas" valor={parseFloat(total.pro)} maximo={proObjetivo} />
                                        <PorcentajeCircular label="Carbohidratos" valor={parseFloat(total.car)} maximo={carObjetivo} />
                                    </>
                                );
                            })()}
                        </Box>
                    </Box>
                )}

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <form onSubmit={handleSubmit}>
                    <DragDropContext onDragEnd={onDragEnd}>
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, mt: 2 }}>
                            <Box sx={{
                                flex: { md: 1 },
                                maxWidth: { md: '60.99999%' },
                                border: '1px dashed gray',
                                borderRadius: 2,
                                p: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2,
                                backgroundColor: '#fafafa'
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

                                <Typography variant="h6">Resultados</Typography>
                                <Typography variant="h6">Resultados de Búsqueda</Typography>
                                <Droppable droppableId="searchResults">
                                    {(provided) => (
                                        <Box
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            sx={{
                                                maxHeight: '400px',
                                                overflowY: 'auto',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: 2,
                                                border: '1px solid #ccc',
                                                borderRadius: 1,
                                                p: 1,
                                                mb: 3,
                                                backgroundColor: '#f0f0ff',
                                            }}
                                        >
                                            {recetasBuscadas.map((receta, index) => (
                                                <Draggable
                                                    key={receta.id}
                                                    draggableId={receta.id}
                                                    index={index}
                                                >
                                                    {(provided) => (
                                                        <RecetaCard receta={receta} provided={provided} />
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </Box>
                                    )}
                                </Droppable>

                                <Typography variant="h6">Resultados por Categoría</Typography>
                                <FormControl fullWidth sx={{ mb: 2 }}>
                                    <InputLabel>Categoría</InputLabel>
                                    <Select
                                        value={categoriaFiltro}
                                        label="Categoría"
                                        onChange={(e) => setCategoriaFiltro(e.target.value)}
                                    >
                                        <MenuItem value="">Todas</MenuItem>
                                        <MenuItem value="Sopas">Sopas</MenuItem>
                                        <MenuItem value="Ensaladas">Ensaladas</MenuItem>
                                        <MenuItem value="Arroz">Arroz</MenuItem>
                                        <MenuItem value="Pasta">Pasta</MenuItem>
                                        <MenuItem value="Guisos">Guisos</MenuItem>
                                        <MenuItem value="Pescado">Pescado</MenuItem>
                                        <MenuItem value="Carne">Carne</MenuItem>
                                        <MenuItem value="Postre">Postre</MenuItem>
                                        <MenuItem value="Fruta">Fruta</MenuItem>
                                    </Select>
                                </FormControl>

                                {/* Filtros nutricionales */}
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    {['kcal', 'pro', 'car'].map((key) => (
                                        <Box key={key}>
                                            <Typography gutterBottom>
                                                {key.toUpperCase()} ({filtrosNutricionales[key][0]} - {filtrosNutricionales[key][1]})
                                            </Typography>
                                            <Slider
                                                value={filtrosNutricionales[key]}
                                                min={0}
                                                max={maximosNutricionales[key]}
                                                onChange={(_, newValue) => {
                                                    setFiltrosNutricionales(prev => ({ ...prev, [key]: newValue }));
                                                }}
                                                valueLabelDisplay="auto"
                                            />
                                        </Box>
                                    ))}
                                    <Button
                                        variant="text"
                                        color="secondary"
                                        onClick={() => {
                                            setFiltrosNutricionales({
                                                kcal: [0, maximosNutricionales.kcal],
                                                pro: [0, maximosNutricionales.pro],
                                                car: [0, maximosNutricionales.car],
                                            });
                                        }}
                                    >
                                        Resetear filtros
                                    </Button>
                                </Box>


                                <Droppable droppableId="categoriaResults">
                                    {(provided) => (
                                        <Box
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            sx={{
                                                maxHeight: '400px',
                                                overflowY: 'auto',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: 2,
                                                border: '1px solid #ccc',
                                                borderRadius: 1,
                                                p: 1,
                                                backgroundColor: '#fffaf0',
                                            }}
                                        >
                                            {recetasFiltradas
                                                .filter(rf => {
                                                    const nombre = rf.name;
                                                    const kcal = rf.kcal ?? rf.energy_kcal ?? 0;
                                                    const pro = rf.pro ?? 0;
                                                    const car = rf.car ?? 0;
                                                    return !recetasBuscadas.some(rb => rb.nombre === nombre) &&
                                                        kcal >= filtrosNutricionales.kcal[0] && kcal <= filtrosNutricionales.kcal[1] &&
                                                        pro >= filtrosNutricionales.pro[0] && pro <= filtrosNutricionales.pro[1] &&
                                                        car >= filtrosNutricionales.car[0] && car <= filtrosNutricionales.car[1];
                                                })
                                                .slice(0, 40)
                                                .map((receta, index) => (
                                                    <Draggable
                                                        key={receta.id}
                                                        draggableId={receta.id}
                                                        index={index}
                                                    >

                                                        {(provided) => (
                                                            <RecetaCard receta={receta} provided={provided} />
                                                        )}
                                                    </Draggable>
                                                ))}
                                            {provided.placeholder}
                                        </Box>
                                    )}
                                </Droppable>

                            </Box>

                            <Box sx={{ flex: { md: 2 }, maxWidth: { md: '39.9999%' } }}>
                                <Typography variant="h6" gutterBottom>Tipo de Ingesta: {tipo}</Typography>
                                <TipoIngestaGrid
                                    estructura={obtenerEstructuraIngesta(tipo)}
                                    recetasPorTipo={recetasPorTipo}
                                    setRecetasPorTipo={setRecetasPorTipo}
                                />
                            </Box>
                        </Box>

                        <Box sx={{ mt: 3, display: 'flex', gap: 5 }}>
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    if (modoEdicion) {
                                        navigate(-1);
                                    } else {
                                        navigate(`/planificacion_dieta/${encodeURIComponent(pacienteN)}/crear_ingesta`);
                                    }
                                }}
                            >
                                Atrás
                            </Button>
                            <Button type="submit" variant="contained" color="primary" disabled={enviando}>
                                {enviando
                                    ? <CircularProgress size={24} />
                                    : modoEdicion
                                        ? 'Actualizar Ingesta'
                                        : 'Crear Ingesta'}
                            </Button>

                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={ingestaUniversal}
                                        onChange={(e) => setIngestaUniversal(e.target.checked)}
                                    />
                                }
                                label="Crear como ingesta universal"
                            />
                        </Box>
                    </DragDropContext>
                </form>
            </Card>
    );

    return isDialogMode ? contenido : <Dashboard>{contenido}</Dashboard>;
}
