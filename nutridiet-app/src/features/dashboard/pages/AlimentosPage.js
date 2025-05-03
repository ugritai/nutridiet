import React, { useEffect, useState } from 'react';
import Dashboard from '../Dashboard';
import FoodGrid from '../components/FoodGrid';
import Search from '../components/Search';
import FoodSearch from '../components/FoodSearch';
import { CircularProgress, Typography } from '@mui/material';

export default function AlimentosPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/alimentos/all_categories')
      .then(res => res.json())
      .then(data => {
        console.log('Data received:', data);  
        setCategories(data.categories);
      })
      .catch(err => {
        console.error("Error al obtener categorías:", err)
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const { 
    query,
    setQuery,
    suggestions,
    handleSearch,
    handleSelectSuggestion,
    handleSuggestions
  } = FoodSearch();

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

      <Typography variant="h4" gutterBottom>
        Categorías de Alimentos
      </Typography>

      {loading ? (
        <CircularProgress />
      ) : (
        <>
          {categories.length === 0 ? (
            <Typography variant="h6" color="error">No se encontraron categorías.</Typography>
          ) : (
            <>
              <FoodGrid categories={categories} />
            </>
          )}
        </>
      )}
    </Dashboard>
  );
}
