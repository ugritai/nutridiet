import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Typography, CircularProgress, Box,
    Pagination, Button, Slider, Checkbox, FormControlLabel
} from '@mui/material';
import UniversalCard from '../components/UniversalCard';
import FoodSearch from '../components/FoodSearch';
import Search from '../components/Search';
import { fetchWithAuth } from './api'; 

const sanitizeFilename = (name) => {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Quitar tildes
    .replace(/[^\w\-]/g, "-")        // Caracteres especiales a guion
    .replace(/-+/g, "-")             // Colapsar guiones
    .trim("-");                      // Limpiar extremos
};

export default function RecipeCategoryCard({ categoria }) {
    const navigate = useNavigate();

    const [recetas, setRecetas] = useState([]);
    const [filteredRecetas, setFilteredRecetas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedLetter, setSelectedLetter] = useState('');

    const [kcalRange, setKcalRange] = useState([0, 1000]);
    const [proRange, setProRange] = useState([0, 100]);
    const [carRange, setCarRange] = useState([0, 100]);

    const [kcalMax, setKcalMax] = useState(1000);
    const [proMax, setProMax] = useState(100);
    const [carMax, setCarMax] = useState(100);

    const [enableFilters, setEnableFilters] = useState(false);
    const itemsPerPage = 9;

    const {
        query, setQuery, suggestions,
        handleSearch, handleSelectSuggestion, handleSuggestions
    } = FoodSearch({ type: 'recetas' });

    const fetchDatos = async () => {
        setLoading(true);
        try {
            const [recetasRes, maximosRes] = await Promise.all([
                fetchWithAuth(`/recetas/categoria/${encodeURIComponent(categoria)}/nutricion_simplificada?por_porcion=true`),
                fetchWithAuth(`/recetas/recetas/maximos_nutricionales?categoria=${encodeURIComponent(categoria)}`)
            ]);

            if (!recetasRes.ok || !maximosRes.ok) throw new Error("Error en la carga de datos");

            const recetasData = await recetasRes.json();
            const maximosData = await maximosRes.json();

            const recetasConDatos = (recetasData.resultados || []).filter(r => r.name);

            const kcal = maximosData.kcal || 1000;
            const pro = maximosData.pro || 100;
            const car = maximosData.car || 100;

            setKcalMax(kcal);
            setProMax(pro);
            setCarMax(car);
            setKcalRange([0, kcal]);
            setProRange([0, pro]);
            setCarRange([0, car]);

            setRecetas(recetasConDatos);
            setFilteredRecetas(recetasConDatos);
            setCurrentPage(1);
            setSelectedLetter('');
        } catch (err) {
            console.error("Error fetching category data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDatos();
    }, [categoria]);

    useEffect(() => {
        const filtro = recetas.filter(r => {
            const passLetter = !selectedLetter || (r.name && r.name.toLowerCase().startsWith(selectedLetter.toLowerCase()));
            if (!enableFilters) return passLetter;

            const passKcal = r.kcal >= kcalRange[0] && r.kcal <= kcalRange[1];
            const passPro = r.pro >= proRange[0] && r.pro <= proRange[1];
            const passCar = r.car >= carRange[0] && r.car <= carRange[1];
            return passLetter && passKcal && passPro && passCar;
        });

        setFilteredRecetas(filtro);
        setCurrentPage(1);
    }, [recetas, selectedLetter, kcalRange, proRange, carRange, enableFilters]);

    const handleSliderChange = (type, value) => {
        if (type === 'kcal') setKcalRange(value);
        if (type === 'pro') setProRange(value);
        if (type === 'car') setCarRange(value);
    };

    const handleLetterClick = (letter) => setSelectedLetter(letter);

    const handleResetFilters = () => {
        setKcalRange([0, kcalMax]);
        setProRange([0, proMax]);
        setCarRange([0, carMax]);
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentRecetas = filteredRecetas.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredRecetas.length / itemsPerPage);
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
            <CircularProgress />
        </Box>
    );

    return (
        <Box sx={{ width: '100%' }}>
            <Search
                value={query}
                onChange={(value) => {
                    setQuery(value);
                    handleSuggestions(value);
                }}
                onSubmit={handleSearch}
                suggestions={suggestions}
                placeholder="Buscar recetas..."
                suggestionClick={handleSelectSuggestion}
            />
            
            <Box sx={{ mt: 4 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                    Recetas en la categoría: {categoria}
                </Typography>

                <FormControlLabel
                    control={<Checkbox checked={enableFilters} onChange={(e) => setEnableFilters(e.target.checked)} />}
                    label="Activar filtros nutricionales"
                />

                {enableFilters && (
                    <Box sx={{ display: 'flex', gap: 4, mt: 3, flexWrap: 'wrap', mb: 2 }}>
                        <Box sx={{ width: 250 }}>
                            <Typography variant="subtitle2">Calorías: {kcalRange[0]} - {kcalRange[1]} kcal</Typography>
                            <Slider value={kcalRange} min={0} max={kcalMax} onChange={(e, val) => handleSliderChange('kcal', val)} valueLabelDisplay="auto" />
                        </Box>
                        <Box sx={{ width: 250 }}>
                            <Typography variant="subtitle2">Proteínas: {proRange[0]} - {proRange[1]} g</Typography>
                            <Slider value={proRange} min={0} max={proMax} onChange={(e, val) => handleSliderChange('pro', val)} valueLabelDisplay="auto" />
                        </Box>
                        <Box sx={{ width: 250 }}>
                            <Typography variant="subtitle2">Carbohidratos: {carRange[0]} - {carRange[1]} g</Typography>
                            <Slider value={carRange} min={0} max={carMax} onChange={(e, val) => handleSliderChange('car', val)} valueLabelDisplay="auto" />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'flex-end', pb: 1 }}>
                            <Button variant="outlined" size="small" onClick={handleResetFilters}>Resetear</Button>
                        </Box>
                    </Box>
                )}

                {/* Abecedario */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2, mb: 3 }}>
                    <Button size="small" variant={selectedLetter === '' ? 'contained' : 'outlined'} onClick={() => handleLetterClick('')}>Todas</Button>
                    {alphabet.map((letter) => {
                        const count = recetas.filter(r => r.name && r.name.toLowerCase().startsWith(letter.toLowerCase())).length;
                        return (
                            <Button key={letter} size="small" variant={selectedLetter === letter ? 'contained' : 'outlined'} onClick={() => handleLetterClick(letter)} disabled={count === 0}>
                                {letter}
                            </Button>
                        );
                    })}
                </Box>

                {/* CUADRÍCULA FORZADA CON CSS GRID */}
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: '1fr',           // 1 columna móvil
                            sm: '1fr 1fr',       // 2 columnas tablet
                            md: '1fr 1fr 1fr'    // 3 columnas escritorio
                        },
                        gap: 3,
                        width: '100%'
                    }}
                >
                    {currentRecetas.map((recetaObj) => {
                        const nombre = recetaObj.name;
                        // LÓGICA DE IMAGEN:
                            // 1. Si la DB ya tiene el campo images (array), usamos el primer elemento
                            // 2. Si no, construimos la ruta basada en el nombre normalizado + .webp
                            const generatedImageName = `${sanitizeFilename(nombre)}.webp`;
                            const imagePath = recetaObj.images && recetaObj.images.length > 0 
                                ? recetaObj.images[0] 
                                : `/static/images_recipies/${generatedImageName}`;

                            return (
                                <UniversalCard
                                    key={nombre}
                                    title={nombre.charAt(0).toUpperCase() + nombre.slice(1)}
                                    image={imagePath} // Usamos la ruta calculada
                                    sx={{ height: '100%' }}
                                    // ... resto de props ...
                                />
                            );
                    })}
                </Box>

                {/* Paginación */}
                {totalPages > 1 && (
                    <Box sx={{ mt: 6, display: 'flex', justifyContent: 'center', pb: 4 }}>
                        <Pagination
                            count={totalPages}
                            page={currentPage}
                            onChange={(e, value) => {
                                setCurrentPage(value);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            color="primary"
                        />
                    </Box>
                )}
            </Box>
        </Box>
    );
}