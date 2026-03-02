// src/pages/RecetasPage.js
import React, { useEffect, useState } from 'react';
import Dashboard from '../Dashboard';
import FoodGrid from '../components/FoodGrid';
import Search from '../components/Search';
import FoodSearch from '../components/FoodSearch';
import { CircularProgress, Typography } from '@mui/material';
import { fetchWithAuth } from '../components/api';

/**
 * Vista principal de catálogo de recetas.
 * Mapea y normaliza las categorías devueltas por el backend para asegurar
 * que coinciden con los assets estáticos (imágenes) disponibles en el frontend.
 */
export default function RecetasPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Categorías con assets de imagen garantizados en el cliente
  const baseCategories = [
    'Sopas', 'Ensaladas', 'Arroz', 'Pasta', 'Guisos', 
    'Pescado', 'Carne', 'Fruta', 'Postres'
  ];

  /**
   * Agrupa subcategorías de la API dentro de las categorías principales del frontend
   * para evitar referencias a imágenes inexistentes (404).
   * @param {string} cat - Categoría raw devuelta por el backend.
   * @returns {string|null} Categoría normalizada o null si no se debe mostrar.
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

    return null; 
  }

  useEffect(() => {
    fetchWithAuth('/recetas/all_categories')
      .then(res => res.json())
      .then(data => {
        const apiCategories = (data.categories || [])
          .map(normalizeCategory)
          .filter(Boolean); // Filtra los null/undefined

        // Unificar categorías base con las recibidas sin duplicados
        const uniqueCategories = Array.from(new Set([...baseCategories, ...apiCategories]));
        setCategories(uniqueCategories);
      })
      .catch(err => {
        console.error("[RecetasPage] Error al obtener categorías:", err);
        setCategories(baseCategories); // Fallback de seguridad
      })
      .finally(() => setLoading(false));
  }, []);

  const {
    query, setQuery, suggestions, handleSearch,
    handleSelectSuggestion, handleSuggestions
  } = FoodSearch({ type: 'recetas' });

  return (
    <Dashboard>
      <Search
        value={query}
        onChange={(value) => { setQuery(value); handleSuggestions(value); }}
        onSubmit={handleSearch}
        suggestions={suggestions}
        placeholder="Buscar recetas..."
        suggestionClick={handleSelectSuggestion}
      />

      <Typography variant="h4" gutterBottom sx={{ mt: 3 }}>Categorías de Recetas</Typography>

      {loading ? (
        <CircularProgress />
      ) : categories.length === 0 ? (
        <Typography variant="h6" color="error">No se encontraron categorías.</Typography>
      ) : (
        <FoodGrid categories={categories} basePath="recetas" shouldMap={false} />
      )}
    </Dashboard>
  );
}