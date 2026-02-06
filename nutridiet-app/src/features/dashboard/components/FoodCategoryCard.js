import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Grid, Typography, CircularProgress, Box, Pagination, Button, IconButton
} from '@mui/material';

import UniversalCard from './UniversalCard';
import Search from './Search';
import FoodSearch from './FoodSearch';
import FiltrosNutricionales from './FoodFilter';
import { fetchWithAuth } from './api';

// Definimos el path del placeholder como una constante para fácil mantenimiento
const FOOD_PLACEHOLDER = '/img/placeholder-food.jpg';

const FiltrosActivos = ({ filters, handleFilterChange }) => {
  const etiquetas = {
    salt: 'Sodio',
    sug: 'Azúcares',
    total_fat: 'Grasa Total',
    trans: 'Grasas Trans',
  };

  const colores = {
    green: { label: 'Bajo', color: '#66BB6A' },
    yellow: { label: 'Moderado', color: '#FFEE58' },
    red: { label: 'Alto', color: '#EF5350' },
  };

  const getEtiqueta = (key, value) => {
    const colorInfo = colores[value];
    if (!colorInfo) return null;

    return (
      <Box
        key={key}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1,
          py: 0.25,
          bgcolor: colorInfo.color,
          borderRadius: 2,
          fontSize: '0.75rem',
        }}
      >
        <Typography variant="caption" fontWeight={500}>
          {etiquetas[key]}: {colorInfo.label}
        </Typography>
        <IconButton
          size="small"
          onClick={() => handleFilterChange(key, '')}
          sx={{ p: 0.5, ml: 0.5 }}
        >
          <Typography variant="caption" sx={{ lineHeight: 1 }}>
            ✕
          </Typography>
        </IconButton>
      </Box>
    );
  };

  const filtrosActivos = Object.entries(filters).filter(([_, v]) => v);

  if (filtrosActivos.length === 0) return null;

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 2 }}>
      {filtrosActivos.map(([key, value]) => getEtiqueta(key, value))}
    </Box>
  );
};

export default function FoodCategoryCard({ categoria }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const getFiltersFromParams = () => ({
    salt: searchParams.get('salt') || '',
    sug: searchParams.get('sug') || '',
    total_fat: searchParams.get('total_fat') || '',
    trans: searchParams.get('trans') || ''
  });

  const [filters, setFilters] = useState(getFiltersFromParams());
  const [alimentos, setAlimentos] = useState([]);
  const [filteredAlimentos, setFilteredAlimentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLetter, setSelectedLetter] = useState('');
  const itemsPerPage = 9;

  const {
    query, setQuery, suggestions,
    handleSearch, handleSelectSuggestion, handleSuggestions
  } = FoodSearch({ type: 'alimentos' });

  useEffect(() => {
    const params = getFiltersFromParams();
    setFilters(params);
    fetchFilteredData(params);
  }, [searchParams, categoria]);

  const fetchFilteredData = (newFilters) => {
    setLoading(true);
    const queryParams = new URLSearchParams(
      Object.entries(newFilters).filter(([k, v]) => v)
    );

    fetchWithAuth(`/alimentos/por_categoria/${encodeURIComponent(categoria)}?${queryParams}`)
      .then(async (res) => {
         if (!res.ok) throw new Error("Error al obtener alimentos");
         return res.json();
      })
      .then(data => {
        setAlimentos(data.alimentos || []);
        setFilteredAlimentos(data.alimentos || []);
        setCurrentPage(1);
        setSelectedLetter('');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    const newSearchParams = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) newSearchParams.set(k, v);
    });

    setSearchParams(newSearchParams);
  };

  const handleResetFilters = () => setSearchParams({});

  const handleLetterClick = (letter) => {
    setSelectedLetter(letter);
    if (letter === '') {
      setFilteredAlimentos(alimentos);
    } else {
      setFilteredAlimentos(
        alimentos.filter(alimento =>
          alimento.nombre.toLowerCase().startsWith(letter.toLowerCase())
        )
      );
    }
    setCurrentPage(1);
  };

  const handlePageChange = (e, value) => {
    setCurrentPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const letterCounts = {};
  alphabet.forEach(letter => {
    letterCounts[letter] = alimentos.filter(alimento =>
      alimento.nombre.toLowerCase().startsWith(letter.toLowerCase())
    ).length;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAlimentos = filteredAlimentos.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAlimentos.length / itemsPerPage);

  if (loading) return <CircularProgress sx={{ mt: 4 }} />;

  return (
    <Box>
      <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }} width={'100%'}>
        <Grid item xs={12} md={10} width={'94%'}>
          <Search
            value={query}
            onChange={(value) => {
              setQuery(value);
              handleSuggestions(value);
            }}
            onSubmit={handleSearch}
            suggestions={suggestions}
            placeholder="Buscar alimentos..."
            suggestionClick={handleSelectSuggestion}
          />
        </Grid>

        <Grid item xs={12} md={2}>
          <Box sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
            <FiltrosNutricionales
              filters={filters}
              handleFilterChange={handleFilterChange}
              handleResetFilters={handleResetFilters}
            />
          </Box>
        </Grid>
      </Grid>

      <FiltrosActivos
        filters={filters}
        handleFilterChange={handleFilterChange}
      />

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Alimentos en la categoría: {categoria}
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
          <Button
            variant={selectedLetter === '' ? 'contained' : 'outlined'}
            onClick={() => handleLetterClick('')}
          >
            Todos
          </Button>
          {alphabet.map((letter) => (
            <Button
              key={letter}
              variant={selectedLetter === letter ? 'contained' : 'outlined'}
              onClick={() => handleLetterClick(letter)}
              disabled={letterCounts[letter] === 0}
            >
              {letter}
            </Button>
          ))}
        </Box>

        <Grid container spacing={2}>
          {currentAlimentos.map((alimento) => (
            <Grid item xs={12} sm={6} md={4} key={alimento.nombre}>
              <UniversalCard
                title={alimento.nombre}
                // ✅ MEJORA: Placeholder si no hay imagen
                image={alimento.image_url || FOOD_PLACEHOLDER}
                buttonLink={`/alimentos/detalle_alimento/${encodeURIComponent(alimento.nombre)}`}
              />
            </Grid>
          ))}
        </Grid>

        {totalPages > 1 && (
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}