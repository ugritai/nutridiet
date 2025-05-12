import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Chip,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { AccessTime, Restaurant, People, Flag, LocalDining } from '@mui/icons-material';
import RecipeNutritionTable from '../components/RecipeNutritionTable';

const ListSection = ({ title, icon: Icon, items, filterFn }) => {
  const theme = useTheme();  // Obtener el tema
  const filteredItems = items.filter(filterFn);

  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <Icon sx={{ mr: 1 }} />
          {title} ({filteredItems.length})
        </Typography>
        <List dense>
          {filteredItems.map((item, index) => (
            <ListItem key={index} sx={{ alignItems: 'flex-start', py: 1.5 }}>
              <ListItemIcon sx={{ mt: '4px', minWidth: 32 }}>
                <Avatar sx={{
                  width: 24,
                  height: 24,
                  bgcolor: theme.palette.primary.main,  // Acceder al color del tema
                  color: theme.palette.primary.contrastText, // Acceder al texto del color del tema
                  fontSize: '0.75rem'
                }}>
                  {index + 1}
                </Avatar>
              </ListItemIcon>
              <ListItemText
                primary={
                  item.ingredient
                    ? item.ingredient.replace(/^'+|'+$/g, '').trim()
                    : item
                      .replace(/\bPaso\s*\d+\b/gi, '')                       // Quitar "Paso 1"
                      .replace(/(?:^|,)\s*'?\d+'?(?=\s|$)/g, '')             // Quitar , '3 o '3
                      .replace(/(^|[\s])[,]+(?=[\s]|$)/g, ' ')               // Quitar comas aisladas
                      .replace(/^'+|'+$/g, '')                               // Quitar comillas de inicio/fin
                      .replace(/\s+/g, ' ')                                  // Espacios múltiples → uno
                      .trim()
                }
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

const getDomainFromUrl = (url) => {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch (error) {
    return url;
  }
};

const DietaryChip = ({ label }) => {
  const theme = useTheme();

  // Mapa de categorías y colores asociados
  const colorMap = {
    'Alto en': 'error',  // Todos los "Alto en" tendrán color error
    'Bajo en': 'success', // Todos los "Bajo en" tendrán color success
    'Sin': 'success',  // Sin tendrá color primario
  };

  const colorKey = Object.keys(colorMap).find(key => label.startsWith(key)) || 'default';

  return (
    <Chip
      label={label}
      variant="outlined"
      size="small"
      sx={{
        borderColor: theme.palette[colorMap[colorKey]]?.main || 'default',
        color: theme.palette[colorMap[colorKey]]?.dark,
        bgcolor: `${theme.palette[colorMap[colorKey]]?.light}30`,
        mr: 1,
        mb: 1
      }}
    />
  );
};

const DifficultyChip = ({ label }) => {
  const theme = useTheme();

  // Mapa de colores para las dificultades
  const colorMap = {
    'Dificultad muy baja': 'success', // Baja dificultad
    'Dificultad baja': 'success',     // Baja dificultad
    'Dificultad media': 'warning',   // Dificultad media
    'Dificultad alta': 'error',      // Alta dificultad
    'Dificultad muy alta': 'error',  // Muy alta dificultad
  };

  return (
    <Chip
      label={label}
      variant="outlined"
      size="small"
      sx={{
        borderColor: theme.palette[colorMap[label]]?.main || 'default',
        color: theme.palette[colorMap[label]]?.dark,
        bgcolor: `${theme.palette[colorMap[label]]?.light}30`,
        mr: 1,
        mb: 1
      }}
    />
  );
};

export default function RecipeDetailCard() {
  const theme = useTheme();
  const { nombre } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  console.log(nombre);
  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:8000/recetas/detalle_receta/${encodeURIComponent(nombre)}`)
      .then(res => res.json())
      .then(data => {
        console.log("Recipe data:", data);
        setRecipe(data.receta);
      })
      .catch(err => console.error("Error:", err))
      .finally(() => setLoading(false));
  }, [nombre]);

  if (loading) return <CircularProgress sx={{ mt: 4 }} />;

  if (!recipe) {
    return (
      <Card sx={{ maxWidth: 1200, mx: 'auto', mt: 4, p: 3 }}>
        <Typography variant="h6" color="textSecondary">
          Receta no encontrada
        </Typography>
      </Card>
    );
  }

  const difficulties = Array.isArray(recipe.dificultad)
    ? recipe.dificultad.filter((difficulty) => difficulty !== "")
    : [];

  return (
    <Card sx={{
      width: '100%',
      mx: 'auto',
      mt: 4,
      boxShadow: 3,
      borderRadius: 4
    }}>
      <CardContent>
        {/* Header Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h3" gutterBottom>
            {recipe.title.charAt(0).toUpperCase() + recipe.title.slice(1)}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Chip
              icon={<LocalDining />}
              label={recipe.categoria}
              color="secondary"
              component={RouterLink}
              to={`/recetas/categorias/${encodeURIComponent(recipe.categoria)}`}
              clickable
            />
            <Chip
              icon={<Flag />}
              label={recipe.origin_ISO}
              variant="outlined"
              sx={{ borderColor: theme.palette.primary.main }}
            />
            <Chip
              icon={<People />}
              label={`${recipe.n_diners} personas`}
            />
            <Chip
              icon={<AccessTime />}
              label={`${recipe.minutes} minutos`}
            />

          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
            {recipe.dietary_preferences.map((pref, index) => (
              <DietaryChip key={index} label={pref} />
            ))}
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
            {difficulties.map((difficulty, index) => (
              <DifficultyChip key={index} label={difficulty} />
            ))}
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Ingredients Section */}
          <Grid item size={{ xs: 12, sm: 4, lg: 4, md: 6 }}>
            <ListSection
              title="Ingredientes"
              icon={Restaurant}
              items={recipe.ingredients}
              filterFn={(ing) => ing.ingredient && ing.ingredient.trim() !== ""}
            />
          </Grid>

          {/* Steps Section */}
          <Grid size={{ xs: 12, sm: 8, lg: 8, md: 6 }}>
            <ListSection
              title="Preparación"
              icon={AccessTime}
              items={recipe.steps}
              filterFn={(step) => {
                // Filtra los pasos vacíos y también elimina "Paso X", comas, comillas y otros caracteres no deseados
                return step
                  .replace(/(Paso\s*\d+|,\s*|'?\d+|'?\s*\d+)/gi, '')  // Eliminar "Paso X", comas y números extra
                  .replace(/^'+|'+$/g, '')  // Eliminar comillas al inicio y final
                  .replace(/(^|[\s])[,]+(?=[\s]|$)/g, ' ')
                  .trim() !== "";  // Filtrar pasos vacíos después de limpiar
              }}
            />
          </Grid>

        </Grid>
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <RecipeNutritionTable />
        </Box>
        {/* Source & Additional Info */}
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="textSecondary">
            Fuente: <Chip
              component="a"
              href={recipe.url}
              label={getDomainFromUrl(recipe.url)}
              clickable
              size="small"
              sx={{ ml: 1 }}
            />
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}