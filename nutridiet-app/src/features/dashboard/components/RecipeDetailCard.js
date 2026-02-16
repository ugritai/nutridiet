import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
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
import { useTheme, alpha } from '@mui/material/styles';
import { AccessTime, Restaurant, People, Flag, LocalDining } from '@mui/icons-material';
import RecipeNutritionTable from '../components/RecipeNutritionTable';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

// ✅ IMPORTACIÓN DE TU API CON AUTH
import { fetchWithAuth } from './api'; 

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
                      .replace(/^\s*([\d]+[\.\)]?|[·•])+\s*/g, '') 
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

  const colorKey = Object.keys(colorMap).find(key => label.startsWith(key));
  const statusColor = colorKey ? colorMap[colorKey] : 'primary';
  const mainColor = theme.palette[statusColor]?.main || theme.palette.primary.main;

  return (
    <Chip
      label={label}
      variant="outlined"
      size="small"
      sx={{
        borderColor: mainColor,
        color: theme.palette[statusColor]?.dark || theme.palette.primary.dark,
        bgcolor: alpha(mainColor, 0.1), 
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

  const statusColor = colorMap[label] || 'default';

  return (
    <Chip
      label={label}
      variant="outlined"
      size="small"
      sx={{
        borderColor: theme.palette[statusColor]?.main || 'default',
        color: theme.palette[statusColor]?.dark,
        bgcolor: theme.palette[statusColor] ? alpha(theme.palette[statusColor].main, 0.1) : 'default',
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
    const fetchData = async () => {
      setLoading(true);
      try {
        // ✅ USANDO fetchWithAuth SEGÚN TU ESTRUCTURA DE GIT
        const response = await fetchWithAuth(`/recetas/detalle_receta/${encodeURIComponent(nombre)}`);
        
        if (!response.ok) throw new Error("Error al obtener la receta");

        const data = await response.json();
        
        setSugeridos(data.sugeridos || []);
        setRecipe({
          ...data.receta,
          dietary_preferences: Array.isArray(data.receta.dietary_preferences) ? data.receta.dietary_preferences : [],
          nutritional_reviw: Array.isArray(data.receta.nutritional_reviw) ? data.receta.nutritional_reviw : []
        });
      } catch (err) {
        console.error("Error:", err);
        setRecipe(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [nombre]);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
      <CircularProgress />
    </Box>
  );

  if (!recipe) {
    return (
      <Card sx={{ maxWidth: '100%', mx: 'auto', mt: 4, boxShadow: 3, borderRadius: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            No se encontró información para la receta solicitada.
          </Typography>
          {sugeridos.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Divider sx={{ mb: 3 }} />
              <Typography variant="h6" gutterBottom>Recetas relacionadas</Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
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
    <Card sx={{ width: '100%', mx: 'auto', mt: 4, boxShadow: 3, borderRadius: 4 }}>
      <CardContent>
        {/* Header Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
            {recipe.title.charAt(0).toUpperCase() + recipe.title.slice(1)}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
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
            <Chip icon={<People />} label={`${recipe.n_diners} personas`} />
            {recipe.minutes != null && (
              <Chip icon={<AccessTime />} label={`${recipe.minutes} minutos`} />
            )}
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
            {recipe.dietary_preferences.map((pref, index) => (
              <DietaryChip key={index} label={pref} />
            ))}
            {difficulties.map((difficulty, index) => (
              <DifficultyChip key={index} label={difficulty} />
            ))}
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Ingredients Section */}
          <Grid item xs={12} md={5} lg={4}>
            <ListSection
                title="Ingredientes"
                icon={Restaurant}
                items={recipe.ingredients || []} // Protegido
                filterFn={(ing) => ing?.ingredient && ing.ingredient.trim() !== ""}
            />
          </Grid>

          {/* Steps Section */}
          <Grid item xs={12} md={7} lg={8}>
            <ListSection
              title="Preparación"
              icon={AccessTime}
              items={recipe.steps}
              filterFn={(step) => {
                return step
                  .replace(/^\s*\d+\.\s*/, '') 
                  .replace(/^\s*([\d]+[\.\)]?|[·•])+\s*/g, '') 
                  .replace(/(Paso\s*\d+|,\s*|'?\d+|'?\s*\d+)/gi, '') 
                  .replace(/^'+|'+$/g, '') 
                  .replace(/(^|[\s])[,]+(?=[\s]|$)/g, ' ') 
                  .trim() !== "";
              }}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <RecipeNutritionTable
            nutritionalInfo={recipe.nutritional_info}
            raciones={recipe.n_diners}
          />
        </Box>

        {(recipe.nutritional_reviw?.length > 0 || recipe.descripcion) && (
          <Box sx={{ mt: 3 }}>
            <Accordion sx={{ borderRadius: 3, boxShadow: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Comentario Nutricional</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  {recipe.nutritional_reviw?.map((review, index) => (
                    <ListItem key={index}>
                      <Typography variant="body2">{review}</Typography>
                    </ListItem>
                  ))}
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

        <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="body2" color="textSecondary">
            Fuente:
            {recipe.url ? (
              <Chip
                component="a"
                href={recipe.url}
                label={getDomainFromUrl(recipe.url)}
                target="_blank"
                clickable
                size="small"
                sx={{ ml: 1 }}
              />
            ) : (
              <Chip label={recipe.source || "Desconocida"} size="small" sx={{ ml: 1 }} />
            )}
          </Typography>
        </Box>

        {/* Relacionados en Footer */}
        {sugeridos.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Divider sx={{ mb: 3 }} />
            <Typography variant="h6" gutterBottom>Recetas relacionadas</Typography>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
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
                      transition: '0.2s',
                      '&:hover': { transform: 'scale(1.05)', boxShadow: 1 }
                    }}
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