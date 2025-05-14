import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Grid, Typography, CircularProgress, Box, Pagination, Button
} from '@mui/material';
import Dashboard from '../Dashboard';
import UniversalCard from '../components/UniversalCard';
import Search from '../components/Search';
import FoodSearch from '../components/FoodSearch';
import FiltrosNutricionales from '../components/FoodFilter';

export default function AlimentosPorCategoriaPage() {
  const { categoria } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  // 📌 Utilidades
  const getFiltersFromParams = () => ({
    salt: searchParams.get('salt') || '',
    sug: searchParams.get('sug') || '',
    total_fat: searchParams.get('total_fat') || '',
    trans: searchParams.get('trans') || ''
  });

  // 🔧 Estados
  const [filters, setFilters] = useState(getFiltersFromParams());
  const [alimentos, setAlimentos] = useState([]);
  const [filteredAlimentos, setFilteredAlimentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLetter, setSelectedLetter] = useState('');
  const itemsPerPage = 9;

  // 🔎 Buscador
  const {
    query, setQuery, suggestions,
    handleSearch, handleSelectSuggestion, handleSuggestions
  } = FoodSearch({ type: 'alimentos' });

  // 🔄 Cuando cambia la URL o la categoría, aplica filtros
  useEffect(() => {
    const params = getFiltersFromParams();
    setFilters(params);
    fetchFilteredData(params);
  }, [searchParams, categoria]);

  // 🔄 Fetch con filtros
  const fetchFilteredData = (newFilters) => {
    setLoading(true);
    const queryParams = new URLSearchParams(
      Object.entries(newFilters).filter(([k, v]) => v)
    );

    fetch(`http://localhost:8000/alimentos/por_categoria/${encodeURIComponent(categoria)}?${queryParams}`)
      .then(res => res.json())
      .then(data => {
        setAlimentos(data.alimentos || []);
        setFilteredAlimentos(data.alimentos || []);
        setCurrentPage(1);
        setSelectedLetter('');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  // 🎯 Cambia filtros y URL
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    const newSearchParams = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) newSearchParams.set(k, v);
    });

    setSearchParams(newSearchParams);
  };

  // 🔁 Resetea filtros
  const handleResetFilters = () => setSearchParams({});

  // 🔤 Filtro por letra
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

  // 📄 Paginación
  const handlePageChange = (e, value) => {
    setCurrentPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 🔠 Generar conteo por letra
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const letterCounts = {};
  alphabet.forEach(letter => {
    letterCounts[letter] = alimentos.filter(alimento =>
      alimento.nombre.toLowerCase().startsWith(letter.toLowerCase())
    ).length;
  });

  // 🧮 Items de paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAlimentos = filteredAlimentos.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAlimentos.length / itemsPerPage);

  if (loading) return <CircularProgress sx={{ mt: 4 }} />;

  return (
    <Dashboard>
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


      {/* 🔠 Filtro por letra */}
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

        {/* 🧾 Lista de alimentos */}
        <Grid container spacing={2}>
          {currentAlimentos.map((alimento) => (
            <Grid size={{ xs: 12, sm: 6, lg: 4, md: 4 }} key={alimento.nombre}>
              <UniversalCard
                title={alimento.nombre}
                image={alimento.image_url}
                buttonLink={`/alimentos/detalle_alimento/${encodeURIComponent(alimento.nombre)}`}
              />
            </Grid>
          ))}
        </Grid>

        {/* 📄 Paginación */}
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
    </Dashboard>
  );
}
