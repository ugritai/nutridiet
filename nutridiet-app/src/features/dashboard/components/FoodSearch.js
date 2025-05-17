import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function FoodSearch({ type = 'alimentos', onSelect }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSuggestions([]);
    const detallePath = type === 'recetas'
      ? `/recetas/detalle_receta/${encodeURIComponent(query)}`
      : `/alimentos/detalle_alimento/${encodeURIComponent(query)}`;
    navigate(detallePath);
  };

  const handleSelectSuggestion = (value) => {
    if (onSelect) {
      // Llama a onSelect si está definido
      onSelect(value);
      return;
    } 
    setSuggestions([]);
    setQuery('');

    const detallePath = type === 'recetas'
      ? `/recetas/detalle_receta/${encodeURIComponent(value)}`
      : `/alimentos/detalle_alimento/${encodeURIComponent(value)}`;
    navigate(detallePath);
  };

  const handleSuggestions = async (value) => {
    if (!value) {
      setSuggestions([]);
      return;
    }

    const endpoint = type === 'recetas'
      ? `http://localhost:8000/recetas/buscar_recetas/${value}`
      : `http://localhost:8000/alimentos/buscar_alimentos/${value}`;

    try {
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error("No encontrado");
      const data = await response.json();

      console.log("Datos recibidos:", data);

      // Convertir el Set a un Array y luego mapearlo a objetos con label y value
      const formattedSuggestions = Array.from(data).map(item => ({
        label: item.nombre || item.titulo,
        value: item.nombre || item.titulo
      }));
      console.log("Sugerencias formateadas:", formattedSuggestions);


      setSuggestions(formattedSuggestions);
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
    setSuggestions,  
    handleSelectSuggestion,
    handleSuggestions
  };
}
