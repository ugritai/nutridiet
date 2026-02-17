import React from 'react';
import { Box } from '@mui/material';
import Dashboard from '../Dashboard';
import Search from '../components/Search';
import FoodSearch from '../components/FoodSearch';
import FoodDetailCard from '../components/FoodDetailCard';
import ReportIssueButton from '../components/ReportIssueButton';
import { useParams } from 'react-router-dom'; // Importamos useParams

export default function DetalleAlimentoPage() {
  // Extraemos el nombre directamente de los parámetros de la URL
  // Asumiendo que tu ruta es /alimentos/detalle_alimento/:nombre
  const { nombre } = useParams(); 

  const {
    query,
    setQuery,
    suggestions,
    handleSearch,
    handleSelectSuggestion,
    handleSuggestions
  } = FoodSearch({ type: 'alimentos' });

  // Función para obtener el nombre a reportar
  // 1. Priorizamos 'nombre' de la URL (si existe el parámetro en el Router)
  // 2. Si no, extraemos la última parte de la ruta (URL clean up)
  // 3. Como último recurso, usamos 'query'
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

      {/* Botón de reporte para alimentos con el nombre real */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <ReportIssueButton itemName={itemName} itemType="alimento" />
      </Box>
    </Dashboard>
  );
}