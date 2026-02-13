import React, { useEffect, useState } from 'react';
import Dashboard from '../Dashboard';
import FoodGrid from '../components/FoodGrid';
import Search from '../components/Search';
import FoodSearch from '../components/FoodSearch';
import { CircularProgress, Typography } from '@mui/material';
import { fetchWithAuth } from '../components/api';

export default function RecetasPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Categorías base que SIEMPRE queremos mostrar y que tienen imagen
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

  /**
   * Mapea categorías de la API a nuestro set cerrado de categorías.
   * Si no reconoce la categoría, devuelve null para filtrarla.
   */
  function normalizeCategory(cat) {
    if (!cat) return null;
    const lower = cat.toLowerCase();

    if (lower.includes('sopa') || lower.includes('caldo')) return 'Sopas';
    if (lower.includes('ensalada') || lower.includes('verdura') || lower.includes('hortaliza')) return 'Ensaladas';
    if (lower.includes('arroz') || lower.includes('grano') || lower.includes('cereal')) return 'Arroz';
    if (lower.includes('pasta') || lower.includes('fideo') || lower.includes('macarron')) return 'Pasta';
    if (lower.includes('guiso') || lower.includes('estofado') || lower.includes('legumbre')) return 'Guisos';
    if (lower.includes('pescado') || lower.includes('marisco') || lower.includes('crustaceo')) return 'Pescado';
    if (lower.includes('carne') || lower.includes('pollo') || lower.includes('cerdo') || lower.includes('embutido')) return 'Carne';
    if (lower.includes('fruta')) return 'Fruta';
    if (lower.includes('postre') || lower.includes('dulce') || lower.includes('azucar') || lower.includes('chocolate')) return 'Postres';

    return null; // Categoría no reconocida (evita errores 404 de imágenes)
  }

  useEffect(() => {
    fetchWithAuth('/recetas/all_categories')
      .then(res => res.json())
      .then(data => {
        // 1. Normalizamos las categorías de la API y filtramos los null
        const apiCategories = (data.categories || [])
          .map(normalizeCategory)
          .filter(cat => cat !== null);

        // 2. Unificamos con las base y eliminamos duplicados
        const uniqueCategories = Array.from(new Set([...RecetaCategories, ...apiCategories]));

        setCategories(uniqueCategories);
      })
      .catch(err => {
        console.error("Error al obtener categorías:", err);
        setCategories(RecetaCategories);
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

      <Typography variant="h4" gutterBottom sx={{ mt: 3 }}>
        Categorías de Recetas
      </Typography>

      {loading ? (
        <CircularProgress />
      ) : (
        <>
          {categories.length === 0 ? (
            <Typography variant="h6" color="error">
              No se encontraron categorías.
            </Typography>
          ) : (
            <FoodGrid 
              categories={categories} 
              basePath="recetas" 
              shouldMap={false} 
            />
          )}
        </>
      )}
    </Dashboard>
  );
}