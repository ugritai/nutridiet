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
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  LinearProgress,
  useTheme
} from '@mui/material';
import { AccessTime, Restaurant, People, Flag, LocalDining } from '@mui/icons-material';

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
      maxWidth: 1200,
      mx: 'auto',
      mt: 4,
      boxShadow: 3,
      borderRadius: 4
    }}>
      <CardContent>
        {/* Header Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h3" gutterBottom>
            {recipe.title}
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
          <Grid item xs={12} md={4}>
            <Card variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Restaurant sx={{ mr: 1 }} />
                  Ingredientes ({recipe.n_ingredients})
                </Typography>

                <List dense>
                  {recipe.ingredients.map((ingredient, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Avatar sx={{
                          width: 24,
                          height: 24,
                          bgcolor: theme.palette.primary.light,
                          color: theme.palette.primary.contrastText,
                          fontSize: '0.75rem'
                        }}>
                          {index + 1}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={ingredient.ingredient}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Steps Section */}
          <Grid item xs={12} md={8}>
            <Card variant="outlined" sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <AccessTime sx={{ mr: 1 }} />
                  Preparación ({recipe.n_steps} pasos)
                </Typography>

                <List>
                  {recipe.steps
                    .map((step) => step.replace(/(Paso \d+|,)/g, '').trim()) // Eliminar 'Paso X' y comas
                    .filter((step) => step) // Filtrar vacíos, por si hay pasos vacíos después de la limpieza
                    .map((step, index) => (
                      <ListItem key={index} sx={{ alignItems: 'flex-start', py: 1.5 }}>
                        <ListItemIcon sx={{ mt: '4px', minWidth: 32 }}>
                          <Avatar sx={{
                            width: 24,
                            height: 24,
                            bgcolor: theme.palette.secondary.main,
                            color: theme.palette.secondary.contrastText,
                            fontSize: '0.75rem'
                          }}>
                            {index + 1}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                              {step}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

        </Grid>

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