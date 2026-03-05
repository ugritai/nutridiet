import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Accordion, AccordionSummary, AccordionDetails, Grid, Card, CardContent,
    Typography, CircularProgress, Divider, Chip, Box, List, ListItem,
    ListItemText, ListItemIcon, Avatar, Paper
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { AccessTime, Restaurant, People, Flag, LocalDining } from '@mui/icons-material';
import RecipeNutritionTable from '../components/RecipeNutritionTable'; 
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { fetchWithAuth } from './api';

// 🔥 IMPORTANTE: Importamos el logo igual que en UniversalCard
import defaultImage from '../../../assets/logo_192.png';

const ListSection = ({ title, icon: Icon, items = [], filterFn }) => {
    const theme = useTheme();
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

const DietaryChip = ({ label }) => {
    const theme = useTheme();
    const colorMap = { 'Alto en': 'error', 'Bajo en': 'success', 'Sin': 'success' };
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
                mr: 1, mb: 1
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
                mr: 1, mb: 1
            }}
        />
    );
};

export default function RecipeDetailCard({ onDataLoaded }) {
    const { nombre } = useParams();
    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // 🛡️ Usamos defaultImage (el logo importado) como estado inicial
    const [imgSrc, setImgSrc] = useState(defaultImage);
    const [imgLoaded, setImgLoaded] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await fetchWithAuth(`/recetas/detalle_receta/${encodeURIComponent(nombre)}`);
                if (!response.ok) throw new Error("Error API");
                const data = await response.json();
                
                const recetaData = {
                    ...data.receta,
                    dietary_preferences: Array.isArray(data.receta?.dietary_preferences) ? data.receta.dietary_preferences : [],
                    ingredients: Array.isArray(data.receta?.ingredients) ? data.receta.ingredients : [],
                    steps: Array.isArray(data.receta?.steps) ? data.receta.steps : [],
                    images: Array.isArray(data.receta?.images) ? data.receta.images : []
                };

                setRecipe(recetaData);
                if (typeof onDataLoaded === 'function') onDataLoaded(recetaData);

                // Si hay imágenes en la DB, intentamos cargar la primera
                if (recetaData.images.length > 0 && recetaData.images[0]) {
                    setImgSrc(recetaData.images[0]);
                } else {
                    // Si no hay, nos quedamos con el logo y marcamos como cargado
                    setImgSrc(defaultImage);
                    setImgLoaded(true);
                }

            } catch (err) {
                console.error("Error cargando receta:", err);
                setImgSrc(defaultImage);
                setImgLoaded(true);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [nombre, onDataLoaded]);

    const handleImageError = () => {
        // Si la imagen del backend falla (404), ponemos el logo
        if (imgSrc !== defaultImage) {
            setImgSrc(defaultImage);
        }
        setImgLoaded(true);
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
    if (!recipe) return <Card sx={{ mt: 4 }}><CardContent><Typography>No se encontró información.</Typography></CardContent></Card>;

    const difficulties = Array.isArray(recipe.dificultad) ? recipe.dificultad.filter(d => d?.trim()) : [];
    const isDefaultImage = imgSrc === defaultImage;

    return (
        <Card sx={{ width: '100%', mx: 'auto', mt: 4, boxShadow: 3, borderRadius: 4, overflow: 'hidden' }}>
            
            {/* CONTENEDOR DE IMAGEN (Logo o Receta) */}
            <Box sx={{ 
                width: '100%', 
                height: { xs: 250, md: 400 }, 
                position: 'relative', 
                bgcolor: isDefaultImage ? 'background.paper' : 'grey.200', 
                display: 'flex', 
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden',
                p: isDefaultImage ? 4 : 0 // Espacio para que el logo no toque los bordes
            }}>
                {!imgLoaded && <CircularProgress size={24} sx={{ position: 'absolute' }} />}

                <Box
                    component="img"
                    src={imgSrc}
                    alt={recipe.title}
                    onLoad={() => setImgLoaded(true)}
                    onError={handleImageError}
                    sx={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        // Si es el logo: 'contain' para no deformar. Si es receta: 'cover' para llenar.
                        objectFit: isDefaultImage ? 'contain' : 'cover',
                        width: isDefaultImage ? 'auto' : '100%',
                        height: isDefaultImage ? '200px' : '100%',
                        visibility: imgLoaded ? 'visible' : 'hidden',
                        opacity: imgLoaded ? (isDefaultImage ? 0.4 : 1) : 0, // Logo sutil
                        transition: 'opacity 0.3s ease'
                    }}
                />
            </Box>

            <CardContent sx={{ p: { xs: 2, md: 4 } }}>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2 }}>
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

                <Divider sx={{ mb: 4 }} />

                <Grid container spacing={4}>
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

                {recipe.detalles && recipe.detalles.trim() !== "" && (
                    <Box sx={{ mt: 4 }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                            Notas y Detalles Adicionales
                        </Typography>
                        <Paper elevation={0} sx={{ p: 2.5, bgcolor: alpha(useTheme().palette.primary.main, 0.05), border: 1, borderColor: 'divider', borderRadius: 2 }}>
                            <Typography variant="body1" sx={{ whiteSpace: 'pre-line', color: 'text.secondary' }}>
                                {recipe.detalles}
                            </Typography>
                        </Paper>
                    </Box>
                )}

                <Box sx={{ mt: 5 }}>
                    <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>Información Nutricional</Typography>
                    <RecipeNutritionTable 
                        nutritionalInfo={recipe.nutritional_info || {}} 
                        raciones={recipe.n_diners || 1} 
                    />
                </Box>
            </CardContent>
        </Card>
    );
}