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

const DietaryChip = ({ label }) => {
  const theme = useTheme();
  const colorMap = {
    'Alto en calorías': 'error',
    'Alto en grasas': 'warning',
    'Alto en sodio': 'info'
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
            <Chip
              icon={<LocalDining />}
              label={recipe.category}
              color="secondary"
            />
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
            {recipe.dietary_preferences.map((pref, index) => (
              <DietaryChip key={index} label={pref} />
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
                        secondary={
                          <LinearProgress 
                            variant="determinate" 
                            value={ingredient.max_similarity * 100}
                            sx={{
                              height: 4,
                              borderRadius: 2,
                              mt: 0.5,
                              backgroundColor: theme.palette.grey[200],
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 2,
                                backgroundColor: theme.palette.success.main
                              }
                            }}
                          />
                        }
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
                  {recipe.steps.map((step, index) => (
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
              label={recipe.source} 
              clickable 
              size="small"
              sx={{ ml: 1 }}
            />
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip 
              label={`ID: ${recipe._id}`} 
              size="small" 
              variant="outlined" 
            />
            <Chip 
              label={recipe.language_ISO} 
              size="small" 
              variant="outlined" 
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}