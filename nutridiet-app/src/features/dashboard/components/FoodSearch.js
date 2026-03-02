// src/pages/AlimentosPage.js
import React, { useEffect, useState } from 'react';
import Dashboard from '../Dashboard';
import FoodGrid from '../components/FoodGrid';
import Search from '../components/Search';
import FoodSearch from '../components/FoodSearch';
import { CircularProgress, Typography } from '@mui/material';
import { fetchWithAuth } from '../components/api';

/**
 * Vista principal del catálogo de alimentos.
 * Carga las categorías desde la API e integra el buscador global de alimentos.
 */
export default function AlimentosPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      fetchWithAuth('/alimentos/all_categories')
      .then(res => res.json())
      .then(data => setCategories(data.categories))
      .catch(err => console.error("[AlimentosPage] Error al obtener categorías:", err))
      .finally(() => setLoading(false));
  }, []);

  // Hook personalizado para abstraer la lógica de autocompletado y búsqueda
  const {
    query, setQuery, suggestions, handleSearch,
    handleSelectSuggestion, handleSuggestions
  } = FoodSearch({ type: 'alimentos' });

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

      <Typography variant="h4" gutterBottom>Categorías de Alimentos</Typography>

      {loading ? (
        <CircularProgress />
      ) : (
        <>
          {categories.length === 0 ? (
            <Typography variant="h6" color="error">No se encontraron categorías.</Typography>
          ) : (
            <FoodGrid categories={categories} basePath="alimentos" imageFolder="alimentos" shouldMap={true} />
          )}
        </>
      )}
    </Dashboard>
  );
}