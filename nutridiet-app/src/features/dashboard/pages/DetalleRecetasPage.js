// src/pages/DetalleRecetasPage.js
import React, { useState, useEffect } from 'react';
import { Box, Button, Stack, Typography, Divider } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

import Dashboard from '../Dashboard';
import Search from '../components/Search';
import FoodSearch from '../components/FoodSearch';
import RecipeDetailCard from '../components/RecipeDetailCard';
import ReportIssueButton from '../components/ReportIssueButton';
import CrearRecetaForm from '../components/CrearRecetaForm'; 
import { fetchWithAuth } from '../components/api';

/**
 * Vista de detalle de receta. 
 * Gestiona dos modos de visualización: Modo Lectura y Modo Edición.
 * Habilita controles de edición/borrado únicamente si el usuario autenticado es el propietario de la receta.
 */
export default function DetalleRecetasPage() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [recetaActual, setRecetaActual] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const {
    query, setQuery, suggestions, handleSearch,
    handleSelectSuggestion, handleSuggestions
  } = FoodSearch({ type: 'recetas' });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetchWithAuth('/auth/me');
        if (response.ok) setCurrentUser(await response.json());
      } catch (error) {
        console.error("[DetalleRecetas] Error obteniendo sesión de usuario:", error);
      }
    };
    fetchUser();
  }, []);

  /**
   * Extrae de forma segura el identificador único de la receta, 
   * independientemente de la estructura anidada que devuelva el backend.
   */
  const extractRecipeId = (receta) => {
    if (!receta) return null;
    return receta._id || receta.id || receta.receta_id || (receta.receta && receta.receta._id) || null;
  };

  const handleEliminar = async () => {
    const idParaEliminar = extractRecipeId(recetaActual);

    if (!idParaEliminar) {
      console.error("[DetalleRecetas] ID no encontrado en la entidad recetaActual:", recetaActual);
      alert("Error interno: No se pudo identificar la receta para su eliminación.");
      return;
    }

    if (window.confirm(`¿Eliminar permanentemente la receta "${recetaActual.title || 'actual'}"?`)) {
      try {
        const response = await fetchWithAuth(`/recetas/eliminar_receta/${idParaEliminar}`, { method: 'DELETE' });
        if (response.ok) {
          navigate('/recetas'); 
        } else {
          const errorData = await response.json();
          alert(`Error al eliminar: ${errorData.detail || 'Consulte al administrador'}`);
        }
      } catch (err) {
        console.error("Error en la petición de borrado:", err);
        alert("Error de conexión con el servidor.");
      }
    }
  };

  const esPropietario = Boolean(
    currentUser?.id && 
    recetaActual?.owner_id && 
    String(recetaActual.owner_id) === String(currentUser.id)
  );

  return (
    <Dashboard>
      {!isEditing && (
        <Search
          value={query}
          onChange={(value) => { setQuery(value); handleSuggestions(value); }}
          onSubmit={handleSearch}
          suggestions={suggestions}
          placeholder="Buscar otra receta..."
          suggestionClick={handleSelectSuggestion}
        />
      )}

      {isEditing ? (
        <Box sx={{ mt: 2, width: '100%' }}>
          <Button onClick={() => setIsEditing(false)} sx={{ mb: 3 }} variant="text" startIcon={<ArrowBackIcon />}>
            Volver a la vista de detalle
          </Button>
          <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
            Editando: {recetaActual?.title || 'Receta'}
          </Typography>
          <Divider sx={{ mb: 4 }} />
          
          {/* Forzamos el re-render del formulario vinculando la key al ID de la receta */}
          <CrearRecetaForm 
                key={extractRecipeId(recetaActual) || 'form-edicion'} 
                recetaEdit={recetaActual?.receta || recetaActual} 
                onSuccess={() => {
                  setIsEditing(false);
                  navigate('/recetas'); // Redirigir para evitar 404 si el título cambió
                }}
          />
        </Box>
      ) : (
        <>
          {recetaActual && esPropietario && (
            <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end', mt: 3, mb: -2, px: 2, position: 'relative', zIndex: 5 }}>
              <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={handleEliminar} sx={{ borderRadius: 2 }}>
                Eliminar
              </Button>
              <Button variant="contained" color="primary" startIcon={<EditIcon />} onClick={() => setIsEditing(true)} sx={{ borderRadius: 2 }}>
                Editar Receta
              </Button>
            </Stack>
          )}

          <RecipeDetailCard onDataLoaded={setRecetaActual} />

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 6, mt: 4 }}>
            <Divider sx={{ width: '100%', mb: 3 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              ¿Has encontrado algún error en esta información?
            </Typography>
            <ReportIssueButton itemName={recetaActual?.title || "Receta"} itemType="receta" />
          </Box>
        </>
      )}
    </Dashboard>
  );
}