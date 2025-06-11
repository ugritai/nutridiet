import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function FoodSearch({ type = 'alimentos', onSelect }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSuggestions([]);

    let detallePath = '';
    if (type === 'recetas') {
      detallePath = `/recetas/detalle_receta/${encodeURIComponent(query)}`;
    } else if (type === 'ingestas') {
      detallePath = `/planificacion_ingestas/ver_ingesta_detalle/${encodeURIComponent(query)}`;
    } else {
      detallePath = `/alimentos/detalle_alimento/${encodeURIComponent(query)}`;
    }

    navigate(detallePath);
  };

  const handleSelectSuggestion = (value) => {
    if (onSelect) {
      onSelect(value);
      return;
    }
    setSuggestions([]);
    setQuery('');

    let detallePath = '';
    if (type === 'recetas') {
      detallePath = `/recetas/detalle_receta/${encodeURIComponent(value)}`;
    } else if (type === 'ingestas') {
      detallePath = `/planificacion_ingestas/ver_ingesta_detalle/${encodeURIComponent(value)}`;
    } else {
      detallePath = `/alimentos/detalle_alimento/${encodeURIComponent(value)}`;
    }

    navigate(detallePath);
  };

  const handleSuggestions = async (value) => {
    if (!value) {
      setSuggestions([]);
      return;
    }

    let endpoint = '';
    if (type === 'recetas') {
      endpoint = `http://localhost:8000/recetas/buscar_recetas/${value}?limit=20`;
    } else if (type === 'ingestas') {
      endpoint = `http://localhost:8000/planificacion_ingestas/buscar_ingestas/${value}`;
    } else {
      endpoint = `http://localhost:8000/alimentos/buscar_alimentos/${value}`;
    }

    try {
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error("No encontrado");
      const data = await response.json();

      const formattedSuggestions = Array.from(data).map(item => ({
        label: item.nombre || item.titulo || item.intake_name,
        value: item.nombre || item.titulo || item.intake_name
      }));

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
