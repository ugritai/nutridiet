import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Grid, Typography, CircularProgress, Box, Pagination, Button } from '@mui/material';
import UniversalCard from '../components/UniversalCard';
import Dashboard from '../Dashboard';
import FoodSearch from '../components/FoodSearch';
import Search from '../components/Search';


export default function AlimentosPorCategoriaPage() {
  const { categoria } = useParams();
  const [alimentos, setAlimentos] = useState([]);
  const [filteredAlimentos, setFilteredAlimentos] = useState([]);
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
    } = FoodSearch();

  useEffect(() => {
    fetch(`http://localhost:8000/alimentos/por_categoria/${encodeURIComponent(categoria)}`)
      .then(res => res.json())
      .then(data => {
        setAlimentos(data.alimentos || []);
        setFilteredAlimentos(data.alimentos || []);
        setCurrentPage(1);
        setSelectedLetter('');
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [categoria]);

  const handleLetterClick = (letter) => {
    setSelectedLetter(letter);
    if (letter === '') {
      setFilteredAlimentos(alimentos);
    } else {
      const filtered = alimentos.filter(nombre => nombre.toLowerCase().startsWith(letter.toLowerCase()));
      setFilteredAlimentos(filtered);
    }
    setCurrentPage(1);
  };

  if (loading) return <CircularProgress sx={{ mt: 4 }} />;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAlimentos = filteredAlimentos.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPages = Math.ceil(filteredAlimentos.length / itemsPerPage);

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // 统计每个字母对应多少 alimentos
  const letterCounts = {};
  alphabet.forEach(letter => {
    letterCounts[letter] = alimentos.filter(nombre => nombre.toLowerCase().startsWith(letter.toLowerCase())).length;
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
              placeholder="Buscar alimentos..."
              suggestionClick={handleSelectSuggestion}
            />
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Alimentos en la categoría: {categoria}
        </Typography>

        {/* 字母筛选器 */}
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
              disabled={letterCounts[letter] === 0} // 🔥 如果该字母没有任何 alimento，就禁用
            >
              {letter}
            </Button>
          ))}
        </Box>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          {currentAlimentos.map((nombre) => (
          <Grid size={{ xs: 12, sm: 6, lg: 4, md: 4 }} key={nombre}>
              <UniversalCard
                title={nombre}
                image="/img/alimentos/default.jpg"
                buttonLink={`/alimentos/detalle_alimento/${encodeURIComponent(nombre)}`}
              />
            </Grid>
          ))}
        </Grid>

        {/* 分页器 */}
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
