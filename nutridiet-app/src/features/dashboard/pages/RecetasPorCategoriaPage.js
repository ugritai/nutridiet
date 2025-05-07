import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Grid, Typography, CircularProgress, Box, Pagination, Button } from '@mui/material';
import UniversalCard from '../components/UniversalCard';
import Dashboard from '../Dashboard';
import FoodSearch from '../components/FoodSearch';
import Search from '../components/Search';

export default function RecetasPorCategoriaPage() {
  const { categoria } = useParams();
  const [recetas, setRecetas] = useState([]);
  const [filteredRecetas, setFilteredRecetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLetter, setSelectedLetter] = useState('');

  const itemsPerPage = 9;

  const {
    query,
    setQuery,
    suggestions,
    handleSearch,
    handleSelectSuggestion,
    handleSuggestions
  } = FoodSearch({ type: 'recetas' });

  useEffect(() => {
    fetch(`http://localhost:8000/recetas/por_categoria/${encodeURIComponent(categoria)}`)
      .then(res => res.json())
      .then(data => {
        setRecetas(data.recetas || []);
        setFilteredRecetas(data.recetas || []);
        setCurrentPage(1);
        setSelectedLetter('');
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [categoria]);

  const handleLetterClick = (letter) => {
    setSelectedLetter(letter);
    if (letter === '') {
      setFilteredRecetas(recetas);
    } else {
      const filtered = recetas.filter(nombre => nombre.toLowerCase().startsWith(letter.toLowerCase()));
      setFilteredRecetas(filtered);
    }
    setCurrentPage(1);
  };

  if (loading) return <CircularProgress sx={{ mt: 4 }} />;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRecetas = filteredRecetas.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPages = Math.ceil(filteredRecetas.length / itemsPerPage);
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const letterCounts = {};
  alphabet.forEach(letter => {
    letterCounts[letter] = recetas.filter(nombre => nombre.toLowerCase().startsWith(letter.toLowerCase())).length;
  });

  return (
    <Dashboard>
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

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
          <Button
            variant={selectedLetter === '' ? 'contained' : 'outlined'}
            onClick={() => handleLetterClick('')}
          >
            Todas
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

        <Grid container spacing={2} sx={{ mt: 2 }}>
          {currentRecetas.map((nombre) => (
            <Grid size={{ xs: 12, sm: 6, lg: 4, md: 4 }} key={nombre}>
              <UniversalCard
                title={nombre.charAt(0).toUpperCase() + nombre.slice(1)}
                buttonLink={`/recetas/detalle_receta/${encodeURIComponent(nombre)}`}
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
    </Dashboard>
  );
}
