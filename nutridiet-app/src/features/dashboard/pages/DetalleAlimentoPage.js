// src/pages/DetalleAlimentoPage.js
import React from 'react';
import { Box } from '@mui/material';
import Dashboard from '../Dashboard';
import Search from '../components/Search';
import FoodSearch from '../components/FoodSearch';
import FoodDetailCard from '../components/FoodDetailCard';
import ReportIssueButton from '../components/ReportIssueButton';
import { useParams } from 'react-router-dom';

/**
 * Vista de detalle de un alimento individual.
 */
export default function DetalleAlimentoPage() {
  const { nombre } = useParams(); 

  const {
    query, setQuery, suggestions, handleSearch,
    handleSelectSuggestion, handleSuggestions
  } = FoodSearch({ type: 'alimentos' });

  // Estrategia de fallback para obtener el nombre del alimento a reportar:
  // 1. Parámetro de React Router (prioridad)
  // 2. Extracción manual de la URL (si falla el router)
  // 3. Valor actual del input de búsqueda
  const itemName = nombre || decodeURIComponent(window.location.pathname.split('/').pop()) || query;

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
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <ReportIssueButton itemName={itemName} itemType="alimento" />
      </Box>
    </Dashboard>
  );
}