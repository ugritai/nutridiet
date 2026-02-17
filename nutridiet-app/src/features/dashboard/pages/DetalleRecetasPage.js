import React from 'react';
import { Box } from '@mui/material';
import Dashboard from '../Dashboard';
import Search from '../components/Search';
import FoodSearch from '../components/FoodSearch';
import RecipeDetailCard from '../components/RecipeDetailCard';
import ReportIssueButton from '../components/ReportIssueButton';
import { fetchWithAuth } from '../components/api';

export default function DetalleRecetasPage() {
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

      <RecipeDetailCard />

      {/* Botón de reporte para recetas */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <ReportIssueButton recipeName={query || "Receta"} />
      </Box>
    </Dashboard>
  );
}