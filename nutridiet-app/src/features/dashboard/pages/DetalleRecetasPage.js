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
import CrearRecetaForm from '../components/CrearRecetaForm'; // O RecetaForm, según cómo lo llames
import { fetchWithAuth } from '../components/api';

export default function DetalleRecetasPage() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [recetaActual, setRecetaActual] = useState(null);
  
  // Estado para guardar quién es el usuario actual
  const [currentUser, setCurrentUser] = useState(null);

  const {
    query,
    setQuery,
    suggestions,
    handleSearch,
    handleSelectSuggestion,
    handleSuggestions
  } = FoodSearch({ type: 'recetas' });

  // Obtener los datos del usuario logueado al cargar la página
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetchWithAuth('/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setCurrentUser(userData);
        }
      } catch (error) {
        console.error("Error obteniendo usuario:", error);
      }
    };
    fetchUser();
  }, []);

  // Función super-segura para sacar el ID
  const obtenerIdReceta = (receta) => {
    if (!receta) return null;
    return receta._id || receta.id || receta.receta_id || (receta.receta && receta.receta._id) || null;
  };

  const handleEliminar = async () => {
    const idParaEliminar = obtenerIdReceta(recetaActual);

    if (!idParaEliminar) {
      console.error("🚨 Falla crítica: No se encontró el ID en recetaActual:", recetaActual);
      alert("Error interno: No se detectó el ID de la receta.");
      return;
    }

    const confirmar = window.confirm(
      `¿Estás seguro de que deseas eliminar permanentemente la receta "${recetaActual.title || 'esta receta'}"? Esta acción no se puede deshacer.`
    );

    if (confirmar) {
      try {
        const response = await fetchWithAuth(`/recetas/eliminar_receta/${idParaEliminar}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          alert("Receta eliminada correctamente.");
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
      {/* 1. BUSCADOR */}
      {!isEditing && (
        <Search
          value={query}
          onChange={(value) => {
            setQuery(value);
            handleSuggestions(value);
          }}
          onSubmit={handleSearch}
          suggestions={suggestions}
          placeholder="Buscar otra receta..."
          suggestionClick={handleSelectSuggestion}
        />
      )}

      {/* 2. MODO EDICIÓN */}
      {isEditing ? (
        <Box sx={{ mt: 2, width: '100%' }}> {/* Aquí aseguramos que use todo el ancho */}
          <Button 
            onClick={() => setIsEditing(false)} 
            sx={{ mb: 3 }} 
            variant="text" 
            startIcon={<ArrowBackIcon />}
          >
            Volver a la vista de detalle
          </Button>
          
          <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
            Editando: {recetaActual?.title || 'Receta'}
          </Typography>
          
          <Divider sx={{ mb: 4 }} />
          
          {/* Le pasamos el ID correcto en el key para forzar el re-render si cambia */}
          <CrearRecetaForm 
                key={obtenerIdReceta(recetaActual) || 'form-edicion'} 
                recetaEdit={recetaActual?.receta || recetaActual} 
                // Recibimos el nuevo título
                onSuccess={(nuevoTitulo) => {
                  setIsEditing(false);
                  // Redirigimos a la lista principal para evitar el error 404 del nombre antiguo
                  navigate('/recetas'); 
                }}
          />
        </Box>
      ) : (
        /* 3. MODO VISTA DETALLE */
        <>
          {/* Barra de herramientas de Propietario */}
          {recetaActual && esPropietario && (
            <Stack 
              direction="row" 
              spacing={2} 
              sx={{ 
                justifyContent: 'flex-end', 
                mt: 3, 
                mb: -2, 
                px: 2,
                position: 'relative',
                zIndex: 5
              }}
            >
              <Button 
                variant="outlined" 
                color="error" 
                startIcon={<DeleteIcon />}
                onClick={handleEliminar}
                sx={{ borderRadius: 2 }}
              >
                Eliminar
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<EditIcon />}
                onClick={() => setIsEditing(true)}
                sx={{ borderRadius: 2 }}
              >
                Editar Receta
              </Button>
            </Stack>
          )}

          {/* TARJETA DE RECETA */}
          <RecipeDetailCard onDataLoaded={setRecetaActual} />

          {/* Botón de reporte */}
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