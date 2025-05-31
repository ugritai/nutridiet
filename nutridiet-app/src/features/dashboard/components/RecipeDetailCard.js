import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink, data } from 'react-router-dom';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Divider,
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
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const ListSection = ({ title, icon: Icon, items, filterFn }) => {
  const theme = useTheme();
  const filteredItems = items.filter(filterFn);

  return (
    <Accordion sx={{ borderRadius: 3, boxShadow: 1 }}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls={`${title}-content`}
        id={`${title}-header`}
      >
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
          <Icon sx={{ mr: 1 }} />
          {title} ({filteredItems.length})
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <List dense>
          {filteredItems.map((item, index) => (
            <ListItem key={index} sx={{ alignItems: 'flex-start', py: 1.5 }}>
              <ListItemIcon sx={{ mt: '4px', minWidth: 32 }}>
                <Avatar
                  sx={{
                    width: 24,
                    height: 24,
                    bgcolor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    fontSize: '0.75rem'
                  }}
                >
                  {index + 1}
                </Avatar>
              </ListItemIcon>
              <ListItemText
                primary={
                  item.ingredient
                    ? item.ingredient.replace(/^'+|'+$/g, '').trim()
                    : item
                      .replace(/^\s*\d+\.\s*/, '')
                      .replace(/^\s*([\d]+[\.\)]?|[·•])+\s*/g, '')  // Elimina números + punto/paréntesis o símbolos · • al inicio
                      .replace(/\bPaso\s*\d+\b/gi, '')
                      .replace(/(?:^|,)\s*'?\d+'?(?=\s|$)/g, '')
                      .replace(/(^|[\s])[,]+(?=[\s]|$)/g, ' ')
                      .replace(/^'+|'+$/g, '')
                      .replace(/\s+/g, ' ')
                      .trim()
                }
              />
            </ListItem>
          ))}
        </List>
      </AccordionDetails>
    </Accordion>
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

  const colorMap = {
    'Alto en': 'error',
    'Bajo en': 'success',
    'Sin': 'success',
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

  const colorMap = {
    'Dificultad muy baja': 'success',
    'Dificultad baja': 'success',
    'Dificultad media': 'warning',
    'Dificultad alta': 'error',
    'Dificultad muy alta': 'error',
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
  const [sugeridos, setSugeridos] = useState([]);


  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:8000/recetas/detalle_receta/${encodeURIComponent(nombre)}`)
      .then(res => res.json())
      .then(data => {
        // Aseguramos que dietary_preferences y nutritional_reviw son arrays
        setSugeridos(data.sugeridos || []);
        setRecipe({
          ...data.receta,
          dietary_preferences: Array.isArray(data.receta.dietary_preferences) ? data.receta.dietary_preferences : [],
          nutritional_reviw: Array.isArray(data.receta.nutritional_reviw) ? data.receta.nutritional_reviw : []
        });
      })
      .catch(err => console.error("Error:", err))
      .finally(() => setLoading(false));
  }, [nombre]);
  console.log(recipe)
  console.log(sugeridos)
  if (loading) return <CircularProgress sx={{ mt: 4 }} />;

  if (!recipe) {
    // Si no hay alimento mostrar sugerencias 
    return (
      <Card sx={{
        maxWidth: '100%',
        mx: 'auto',
        mt: 4,
        boxShadow: 3,
        borderRadius: 4
      }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            No se encontró información para el receta solicitado.
          </Typography>

          {sugeridos.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Divider sx={{ mb: 3 }} />
              <Typography variant="h6" gutterBottom>
                Recetas relacionados
              </Typography>
              <Box sx={{
                display: 'flex',
                gap: 2,
                flexWrap: 'wrap'
              }}>
                {sugeridos.map((item, index) => {
                  const nombreSugerido = typeof item === 'string' ? item : item.titulo;
                  return (
                    <Chip
                      key={index}
                      label={nombreSugerido}
                      component={RouterLink}
                      to={`/recetas/detalle_receta/${encodeURIComponent(nombreSugerido)}`}
                      clickable
                    />
                  );
                })}
              </Box>
            </Box>
          )}
        </CardContent>
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
            {recipe.minutes != null && (
              <Chip
                icon={<AccessTime />}
                label={`${recipe.minutes} minutos`}
              />
            )}
          </Box>

          {recipe.dietary_preferences.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
              {recipe.dietary_preferences.map((pref, index) => (
                <DietaryChip key={index} label={pref} />
              ))}
            </Box>
          )}

          {difficulties.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
              {difficulties.map((difficulty, index) => (
                <DifficultyChip key={index} label={difficulty} />
              ))}
            </Box>
          )}
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
                return step
                  .replace(/^\s*\d+\.\s*/, '')  // elimina "1. ", "2. " al inicio del paso
                  .replace(/^\s*([\d]+[\.\)]?|[·•])+\s*/g, '')  // Elimina números + punto/paréntesis o símbolos · • al inicio
                  .replace(/(Paso\s*\d+|,\s*|'?\d+|'?\s*\d+)/gi, '')  // Eliminar "Paso X", comas y números extra
                  .replace(/^'+|'+$/g, '')  // Eliminar comillas al inicio y final
                  .replace(/(^|[\s])[,]+(?=[\s]|$)/g, ' ')  // Eliminar comas sueltas
                  .trim() !== "";
              }}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <RecipeNutritionTable
            nutritionalInfo={recipe.nutritional_info}
            raciones={recipe.n_diners}
          />
        </Box>

        {(recipe.nutritional_reviw?.length > 0 || recipe.descripcion) && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Accordion sx={{ borderRadius: 3, boxShadow: 1, width: '100%' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  Comentario Nutricional
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {/* Si hay array de reviews */}
                  {recipe.nutritional_reviw?.map((review, index) => (
                    <ListItem key={index}>
                      <Typography variant="body2">{review}</Typography>
                    </ListItem>
                  ))}
                  {/* Si hay un comentario único en 'descripcion' */}
                  {recipe.descripcion && (
                    <ListItem>
                      <Typography variant="body2">{recipe.descripcion}</Typography>
                    </ListItem>
                  )}
                </List>
              </AccordionDetails>
            </Accordion>
          </Box>
        )}


        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            Fuente:{" "}
            {recipe.url ? (
              <Chip
                component="a"
                href={recipe.url}
                label={getDomainFromUrl(recipe.url)}
                clickable
                size="small"
                sx={{ ml: 1 }}
              />
            ) : recipe.source ? (
              <Chip
                label={recipe.source}
                size="small"
                sx={{ ml: 1, maxWidth: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              />
            ) : (
              <Chip
                label="Desconocida"
                size="small"
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
        </Box>

        {/* Recetas relacionados */}
        {
          sugeridos.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Divider sx={{ mb: 3 }} />
              <Typography variant="h6" gutterBottom>
                Recetas relacionados
              </Typography>
              <Box sx={{
                display: 'flex',
                gap: 2,
                flexWrap: 'wrap'
              }}>
                {sugeridos.map((item, index) => {
                  const nombreSugerido = typeof item === 'string' ? item : item.titulo;
                  return (
                    <Chip
                      key={index}
                      label={nombreSugerido}
                      component={RouterLink}
                      to={`/recetas/detalle_receta/${encodeURIComponent(nombreSugerido)}`}
                      clickable
                      sx={{
                        borderRadius: 1,
                        px: 2,
                        transition: 'all 0.3s',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 2
                        }
                      }}
                    />
                  );
                })}
              </Box>
            </Box>
          )
        }
      </CardContent>
    </Card>
  );
}
