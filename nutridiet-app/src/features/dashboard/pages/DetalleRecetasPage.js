import React from 'react';
import Dashboard from '../Dashboard';
import Search from '../components/Search';
import FoodSearch from '../components/FoodSearch';
import RecipeDetailCard from '../components/RecipeDetailCard';

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
    </Dashboard>
  );
}
