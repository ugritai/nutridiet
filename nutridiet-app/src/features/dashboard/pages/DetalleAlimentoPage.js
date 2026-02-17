import React from 'react';
import { Box } from '@mui/material';
import Dashboard from '../Dashboard';
import Search from '../components/Search';
import FoodSearch from '../components/FoodSearch';
import FoodDetailCard from '../components/FoodDetailCard';
import ReportIssueButton from '../components/ReportIssueButton';
import { fetchWithAuth } from '../components/api';


export default function DetalleAlimentoPage() {
  const {
    query,
    setQuery,
    suggestions,
    handleSearch,
    handleSelectSuggestion,
    handleSuggestions
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

      <FoodDetailCard />

      {/* Botón de reporte para alimentos */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <ReportIssueButton recipeName={query || "Alimento"} />
      </Box>
    </Dashboard>
  );
}