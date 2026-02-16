import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Accordion, AccordionSummary, AccordionDetails, Grid, Card, CardContent,
  Typography, CircularProgress, Divider, Chip, Box, List, ListItem,
  ListItemText, ListItemIcon, Avatar,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { AccessTime, Restaurant, People, Flag, LocalDining } from '@mui/icons-material';
import RecipeNutritionTable from '../components/RecipeNutritionTable';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { fetchWithAuth } from './api'; 

const ListSection = ({ title, icon: Icon, items = [], filterFn }) => {
  const theme = useTheme();
  // ✅ Protección: Asegurar que items sea siempre un array antes de filtrar
  const safeItems = Array.isArray(items) ? items : [];
  const filteredItems = safeItems.filter(filterFn);

  return (
    <Accordion sx={{ borderRadius: 3, boxShadow: 1 }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
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
                <Avatar sx={{ width: 24, height: 24, bgcolor: theme.palette.primary.main, fontSize: '0.75rem' }}>
                  {index + 1}
                </Avatar>
              </ListItemIcon>
              <ListItemText
                primary={
                  typeof item === 'object' && item?.ingredient
                    ? item.ingredient.replace(/^'+|'+$/g, '').trim()
                    : String(item).replace(/^\s*([\d]+[\.\)]?|[·•])+\s*/g, '').trim()
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
        const response = await fetchWithAuth(`/recetas/detalle_receta/${encodeURIComponent(nombre)}`);
        if (!response.ok) throw new Error("Error al obtener la receta");
        const data = await response.json();
        
        setSugeridos(data.sugeridos || []);
        setRecipe({
          ...data.receta,
          dietary_preferences: Array.isArray(data.receta?.dietary_preferences) ? data.receta.dietary_preferences : [],
          nutritional_reviw: Array.isArray(data.receta?.nutritional_reviw) ? data.receta.nutritional_reviw : [],
          ingredients: Array.isArray(data.receta?.ingredients) ? data.receta.ingredients : [],
          steps: Array.isArray(data.receta?.steps) ? data.receta.steps : []
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

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  if (!recipe) return <Card sx={{ mt: 4 }}><CardContent><Typography>No se encontró información.</Typography></CardContent></Card>;

  // ✅ Protección definitiva para dificultades (Línea que causaba el error)
  const difficulties = Array.isArray(recipe.dificultad) 
    ? recipe.dificultad.filter(d => d && d.trim() !== "") 
    : [];

  return (
    <Card sx={{ width: '100%', mx: 'auto', mt: 4, boxShadow: 3, borderRadius: 4 }}>
      <CardContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
            {recipe.title?.charAt(0).toUpperCase() + recipe.title?.slice(1)}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <Chip icon={<LocalDining />} label={recipe.categoria || 'General'} color="secondary" />
            <Chip icon={<Flag />} label={recipe.origin_ISO || 'ESP'} variant="outlined" />
            <Chip icon={<People />} label={`${recipe.n_diners || 1} personas`} />
            {recipe.minutes != null && <Chip icon={<AccessTime />} label={`${recipe.minutes} min`} />}
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
            {recipe.dietary_preferences?.map((pref, i) => <DietaryChip key={i} label={pref} />)}
            {difficulties.map((diff, i) => <DifficultyChip key={i} label={diff} />)}
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <ListSection
              title="Ingredientes"
              icon={Restaurant}
              items={recipe.ingredients}
              filterFn={(ing) => ing?.ingredient && ing.ingredient.trim() !== ""}
            />
          </Grid>
          <Grid item xs={12} md={7}>
            <ListSection
              title="Preparación"
              icon={AccessTime}
              items={recipe.steps}
              filterFn={(step) => typeof step === 'string' && step.trim() !== ""}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <RecipeNutritionTable 
            nutritionalInfo={recipe.nutritional_info || {}} 
            raciones={recipe.n_diners || 1} 
          />
        </Box>
      </CardContent>
    </Card>
  );
}