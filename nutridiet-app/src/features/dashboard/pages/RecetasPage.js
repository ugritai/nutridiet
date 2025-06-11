import React, { useEffect, useState } from 'react';
import Dashboard from '../Dashboard';
import FoodGrid from '../components/FoodGrid';
import Search from '../components/Search';
import FoodSearch from '../components/FoodSearch';
import { CircularProgress, Typography } from '@mui/material';

export default function RecetasPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const RecetaCategories = [
    'Sopas',
    'Ensaladas',
    'Arroz',
    'Pasta',
    'Guisos',
    'Pescado',
    'Carne',
    'Fruta',
    'Postres'
  ];
  
  // Mapeo de categorías del backend a categorías normalizadas
  const categoryMapping = {
    '2. pescados y mariscos': 'Pescado',
    'carnes y derivados': 'Carne',
    '1. verduras y hortalizas': 'Verduras',
    'plato principal': 'Plato principal',
    'primer plato': 'Entrante',
    'entrante': 'Entrante',
    'acompañamiento': 'Acompañamiento',
    'otros': 'Otros',
    'embutidos': 'Carne',
  };
  
  function normalizeCategory(cat) {
    const lower = cat.trim().toLowerCase();
    return categoryMapping[lower] || capitalize(lower);
  }
  
  function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }
  
  useEffect(() => {
    fetch('http://localhost:8000/recetas/all_categories')
      .then(res => res.json())
      .then(data => {
        console.log('Data received:', data);
        const apiCategories = data.categories.map(normalizeCategory);
        const baseCategories = RecetaCategories.map(capitalize);
  
        // Unificar y eliminar duplicados
        const all = [...baseCategories, ...apiCategories];
        const unique = Array.from(new Set(all));
  
        setCategories(unique);
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
  } = FoodSearch({ type: 'recetas' });

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

      <Typography variant="h4" gutterBottom>
        Categorías de Recetas
      </Typography>

      {loading ? (
        <CircularProgress />
      ) : (
        <>
          {categories.length === 0 ? (
            <Typography variant="h6" color="error">No se encontraron categorías.</Typography>
          ) : (
            <>
              <FoodGrid categories={categories} basePath="recetas" imageFolder="recetas" />
            </>
          )}
        </>
      )}
    </Dashboard>
  );
}
