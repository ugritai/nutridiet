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

  // Categorías base que siempre queremos mostrar
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
  
  // Función para convertir nombres largos de BedCA a tus nombres cortos
  function normalizeCategory(cat) {
    if (!cat) return 'Otros';
    const lower = cat.toLowerCase();

    // Lógica de palabras clave para unificar categorías
    if (lower.includes('sopa') || lower.includes('caldo')) return 'Sopas';
    if (lower.includes('ensalada') || lower.includes('verdura') || lower.includes('hortaliza')) return 'Ensaladas';
    if (lower.includes('arroz') || lower.includes('grano') || lower.includes('cereal')) return 'Arroz';
    if (lower.includes('pasta') || lower.includes('fideo') || lower.includes('macarron')) return 'Pasta';
    if (lower.includes('guiso') || lower.includes('estofado') || lower.includes('legumbre')) return 'Guisos';
    if (lower.includes('pescado') || lower.includes('marisco') || lower.includes('crustaceo')) return 'Pescado';
    if (lower.includes('carne') || lower.includes('pollo') || lower.includes('cerdo') || lower.includes('embutido')) return 'Carne';
    if (lower.includes('fruta')) return 'Fruta';
    if (lower.includes('postre') || lower.includes('dulce') || lower.includes('azucar') || lower.includes('chocolate')) return 'Postres';
    
    // Si no coincide con nada conocido, lo dejamos tal cual (o podrías retornas null para filtrarlo)
    return capitalize(cat);
  }
  
  function capitalize(text) {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }
  
  useEffect(() => {
      fetchWithAuth('/recetas/all_categories')
      .then(res => res.json())
      .then(data => {
        console.log('Data received:', data);
        
        // 1. Normalizamos las categorías que vienen de la API
        const apiCategories = data.categories.map(normalizeCategory);
        
        // 2. Unificamos con tus categorías base
        const allCategories = [...RecetaCategories, ...apiCategories];
        
        // 3. Eliminamos duplicados usando un Set
        const uniqueCategories = Array.from(new Set(allCategories)); // "Carne" de la lista y "Carne" normalizado se fusionan aquí

        setCategories(uniqueCategories);
      })
      .catch(err => {
        console.error("Error al obtener categorías:", err)
        // Si falla la API, al menos mostramos las categorías base
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
              {/* Pasamos 'recetas' para que busque en /img/recetas/ y use nombres cortos */}
              <FoodGrid categories={categories} basePath="recetas" imageFolder="recetas" />
            </>
          )}
        </>
      )}
    </Dashboard>
  );
}