import * as React from 'react';
import { alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Header from '../components/Header';
import UserMenu from '../components/SideMenu';
import AppTheme from '../../../assets/shared-theme/AppTheme';
import CategorySelect from '../components/CategorySelect';
import Search from '../components/Search';
import { useState } from 'react';
import CircularProgress from '@mui/material/CircularProgress'; 


export default function BusquedaRecetas(props) {
  const [recipes, setRecipes] = useState([]);  // Estado para las recetas
  const [loading, setLoading] = useState(false);  // Estado para mostrar el indicador de carga

  // Función para manejar el cambio de categoría y buscar las recetas
  const handleCategoryChange = async (category) => {
    setLoading(true);  // Mostrar indicador de carga

    try {
      const response = await fetch(`http://localhost:8000/recipes_by_category/${category}`);
      if (response.ok) {
        const data = await response.json();
        setRecipes(data.recipes || []);  // Guardar las recetas obtenidas
      } else {
        setRecipes([]);  // Si no se encuentran recetas, establecer el array vacío
      }
    } catch (error) {
      console.error('Error al obtener recetas:', error);
      setRecipes([]);  // En caso de error, también establecer el array vacío
    } finally {
      setLoading(false);  // Finaliza el estado de carga
    }
  };

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <Box sx={{ display: 'flex' }}>
        <UserMenu />
        {/* Main content */}
        <Box
          component="main"
          sx={(theme) => ({
            flexGrow: 1,
            backgroundColor: theme.vars
              ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
              : alpha(theme.palette.background.default, 1),
            overflow: 'auto',
          })}
        >
          <Stack
            spacing={2}
            sx={{
              alignItems: 'center',
              mx: 3,
              pb: 5,
              mt: { xs: 8, md: 0 },
            }}
          >
            <Header />
            <Search />
            <CategorySelect onCategoryChange={handleCategoryChange} />
            
            {/* Mostrar recetas cuando no esté cargando */}
            {loading ? (
              <CircularProgress />
            ) : (
              <div>
                <h2>Recetas:</h2>
                <ul>
                  {recipes.length > 0 ? (
                    recipes.map((recipe, index) => (
                      <li key={index}>{recipe}</li>
                    ))
                  ) : (
                    <p>No se encontraron recetas para esta categoría.</p>
                  )}
                </ul>
              </div>
            )}
          </Stack>
        </Box>
      </Box>
    </AppTheme>
  );
}