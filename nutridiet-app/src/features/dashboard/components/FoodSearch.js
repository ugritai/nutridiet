import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function FoodSearch() {  
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const navigate = useNavigate();

  const handleSearch = async () => {
    // Check if query is empty, and only navigate if it's not
    if (!query.trim()) {
      return; // Prevent navigation if search query is empty
    }
    setSuggestions([]);
    navigate(`/alimentos/detalle_alimento/${encodeURIComponent(query)}`);
  };

  const handleSelectSuggestion = (value) => {
    setSuggestions([]);  
    setQuery('');        
    navigate(`/alimentos/detalle_alimento/${encodeURIComponent(value)}`);
  };

  const handleSuggestions = async (value) => {
    if (!value) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8000/alimentos/sugerir_alimentos/${value}`
      );
      if (!response.ok) throw new Error("No encontrado");
      const data = await response.json();
      setSuggestions(data.map(item => item.nombre));
    } catch (err) {
      console.error("Error fetching suggestions:", err);
      setSuggestions([]);
    }
  };

  return {
    query,
    setQuery,
    suggestions,
    handleSearch,
    handleSelectSuggestion,
    handleSuggestions
  };
}
