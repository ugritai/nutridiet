import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
//  1. IMPORTAR fetchWithAuth (Ajusta la ruta si 'api.js' está en otra carpeta)
import { fetchWithAuth } from './api'; 

export default function FoodSearch({ type = 'alimentos', onSelect }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSuggestions([]);

    let detallePath = '';
    // Estas rutas son de React Router (Frontend), así que NO llevan /api. Están bien.
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

    // Definimos la ruta relativa (fetchWithAuth le pondrá el /api delante)
    let endpoint = '';
    if (type === 'recetas') {
        endpoint = `/recetas/buscar_recetas/${encodeURIComponent(value)}?limit=20`;
    } else if (type === 'ingestas') {
        endpoint = `/planificacion_ingestas/buscar_ingestas/${encodeURIComponent(value)}`;
    } else {
        endpoint = `/alimentos/buscar_alimentos/${encodeURIComponent(value)}`;
    }

    try {
      //  2. USAR fetchWithAuth EN LUGAR DE fetch
      const response = await fetchWithAuth(endpoint);
      
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