import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Grid, Typography, CircularProgress, Box,
    Pagination, Button, Slider, Checkbox, FormControlLabel
} from '@mui/material';
import UniversalCard from '../components/UniversalCard';
import FoodSearch from '../components/FoodSearch';
import Search from '../components/Search';

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
                fetch(`http://localhost:8000/recetas/categoria/${encodeURIComponent(categoria)}/nutricion_simplificada?por_porcion=true`),
                fetch(`http://localhost:8000/recetas/recetas/maximos_nutricionales?categoria=${encodeURIComponent(categoria)}`)
            ]);

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
            console.error(err);
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

    const handleLetterClick = (letter) => {
        setSelectedLetter(letter);
    };

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

    if (loading) return <CircularProgress sx={{ mt: 4 }} />;

    return (
        <>
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
                <Typography variant="h5" gutterBottom>
                    Recetas en la categoría: {categoria}
                </Typography>

                <FormControlLabel
                    control={<Checkbox checked={enableFilters} onChange={(e) => setEnableFilters(e.target.checked)} />}
                    label="Activar filtros nutricionales"
                />

                {enableFilters && (
                    <Box sx={{ display: 'flex', gap: 4, mt: 3, flexWrap: 'wrap' }}>
                        <Box sx={{ width: 300 }}>
                            <Typography variant="subtitle1">Calorías (kcal)</Typography>
                            <Slider
                                value={kcalRange}
                                min={0}
                                max={kcalMax}
                                onChange={(e, val) => handleSliderChange('kcal', val)}
                                valueLabelDisplay="auto"
                            />
                        </Box>
                        <Box sx={{ width: 300 }}>
                            <Typography variant="subtitle1">Proteínas (g)</Typography>
                            <Slider
                                value={proRange}
                                min={0}
                                max={proMax}
                                onChange={(e, val) => handleSliderChange('pro', val)}
                                valueLabelDisplay="auto"
                            />
                        </Box>
                        <Box sx={{ width: 300 }}>
                            <Typography variant="subtitle1">Carbohidratos (g)</Typography>
                            <Slider
                                value={carRange}
                                min={0}
                                max={carMax}
                                onChange={(e, val) => handleSliderChange('car', val)}
                                valueLabelDisplay="auto"
                            />
                        </Box>
                    </Box>
                )}

                {enableFilters && (
                    <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                        <Button variant="outlined" onClick={handleResetFilters}>
                            Resetear filtros
                        </Button>
                    </Box>
                )}

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 4, mb: 3 }}>
                    <Button variant={selectedLetter === '' ? 'contained' : 'outlined'} onClick={() => handleLetterClick('')}>Todas</Button>
                    {alphabet.map((letter) => {
                        const count = recetas.filter(r =>
                            r.name && r.name.toLowerCase().startsWith(letter.toLowerCase())
                        ).length;

                        return (
                            <Button
                                key={letter}
                                variant={selectedLetter === letter ? 'contained' : 'outlined'}
                                onClick={() => handleLetterClick(letter)}
                                disabled={count === 0}
                            >
                                {letter}
                            </Button>
                        );
                    })}
                </Box>

                <Grid container spacing={2}>
                    {currentRecetas.map((recetaObj) => {
                        const nombre = recetaObj.name;
                        if (!nombre) return null;

                        return (
                            <Grid size={{ xs: 12, sm: 6, lg: 4, md: 4 }} key={nombre}>
                                <UniversalCard
                                    title={nombre.charAt(0).toUpperCase() + nombre.slice(1)}
                                    onAction={() =>
                                        navigate(`/recetas/detalle_receta/${encodeURIComponent(nombre)}`, {
                                            state: {
                                                desdeDieta: false,
                                                dietaNombre: nombre
                                            }
                                        })
                                    }
                                />
                            </Grid>
                        );
                    })}
                </Grid>

                {totalPages > 1 && (
                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                        <Pagination
                            count={totalPages}
                            page={currentPage}
                            onChange={(e, value) => setCurrentPage(value)}
                            color="primary"
                        />
                    </Box>
                )}
            </Box>
        </>
    );
}
