import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CircularProgress,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemButton,
  ListItemText
} from '@mui/material';

import Dashboard from '../Dashboard';
import Search from '../components/Search';
import FoodSearch from '../components/FoodSearch';


export default function DetalleAlimentoPage() {
  const {
    query,
    setQuery,
    suggestions,
    handleSearch,
    handleSelectSuggestion,
    handleSuggestions
  } = FoodSearch();

  const { nombre } = useParams();
  const [alimento, setAlimento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sugeridos, setSugeridos] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:8000/alimentos/detalle_alimento/${encodeURIComponent(nombre)}`)
      .then(res => {
        if (!res.ok) throw new Error("No encontrado");
        return res.json();
      })
      .then(data => {
        setAlimento(data.alimento || null);
        setSugeridos(data.sugeridos || []);
        setMessage(data.message || '');
      })
      .catch(err => {
        console.error("Error:", err);
      })
      .finally(() => setLoading(false));
  }, [nombre]);

  if (loading) return <CircularProgress />;

  if (!alimento && sugeridos.length === 0) {
    return <Typography color="error">Alimento no encontrado y no hay sugerencias</Typography>;
  }

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
      <Card sx={{ maxWidth: 600, margin: 'auto', mt: 4 }}>
        <CardContent>
          {/* Detalle del alimento */}
          {alimento && (
            <>
              <Typography variant="h5">{alimento.name_esp}</Typography>
              <Typography variant="h6">Categoría: {alimento.category_esp}</Typography>
              <Typography variant="body1">Energía: {alimento.nutritional_info_100g.energy_kcal} kcal</Typography>
              <Typography variant="body1">Proteínas: {alimento.nutritional_info_100g.pro} g</Typography>
              <Typography variant="body1">Grasas Totales: {alimento.nutritional_info_100g.fats.total_fat} g</Typography>
              <Typography variant="body1">Grasas Saturadas: {alimento.nutritional_info_100g.fats.sat} g</Typography>
              <Typography variant="body1">Fibra: {alimento.nutritional_info_100g.fiber} g</Typography>
              <Typography variant="body1">Sodio: {alimento.nutritional_info_100g.sod} mg</Typography>
              <Typography variant="body1">Colesterol: {alimento.nutritional_info_100g.cholesterol} mg</Typography>
            </>
          )}

          {/* Mensaje opcional */}
          {message && (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
              {message}
            </Typography>
          )}

          {/* Lista de sugerencias */}
          {sugeridos.length > 0 && (
            <>
              <Typography variant="h6" sx={{ mt: 2 }}>
                Alimentos relacionados:
              </Typography>
              <List>
                {sugeridos.map((item, index) => {
                  // Maneja tanto string como objeto { nombre: string }
                  const nombreSugerido = typeof item === 'string' ? item : item.nombre;
                  return (
                    <ListItem key={nombreSugerido + index} disablePadding>
                      <ListItemButton
                        component={Link}
                        to={`/alimentos/detalle_alimento/${encodeURIComponent(nombreSugerido)}`}
                      >
                        <ListItemText primary={nombreSugerido} />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </>
          )}
        </CardContent>
      </Card>
    </Dashboard>
  );
}
