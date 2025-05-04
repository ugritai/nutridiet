import React from 'react';
import Dashboard from '../Dashboard';
import Search from '../components/Search';
import FoodSearch from '../components/FoodSearch';
import FoodDetailCard from '../components/FoodDetailCard';

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
    </Dashboard>
  );
}
