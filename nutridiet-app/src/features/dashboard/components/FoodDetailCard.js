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
    Table,
    TableBody,
    TableCell,
    TableRow,
    useTheme,
} from '@mui/material';
import { LocalDining } from '@mui/icons-material';

const OmsChip = ({ type, status }) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const typeLabels = {
        salt: 'Sal',
        sugar: 'Azúcar',
        fat: 'Grasa'
    };

    // añadir valor default 
    const getStatusColor = (status) => {
        const lightColors = {
            red: { bg: '#ffebee', text: '#ff5252', border: '#ff5252' },
            yellow: { bg: '#fff8e1', text: '#ffa000', border: '#ffc107' },
            green: { bg: '#e8f5e9', text: '#4caf50', border: '#4caf50' },
            default: { bg: '#f5f5f5', text: '#616161', border: '#e0e0e0' }
        };

        const darkColors = {
            red: { bg: '#311b1b', text: '#ff867c', border: '#ff5252' },
            yellow: { bg: '#332900', text: '#ffd95e', border: '#ffc107' },
            green: { bg: '#1b2a1d', text: '#66bb6a', border: '#4caf50' },
            default: { bg: '#424242', text: '#e0e0e0', border: '#616161' }
        };

        return (isDark ? darkColors : lightColors)[status] || (isDark ? darkColors : lightColors).default;
    };

    const statusTextMap = {
        green: 'bajo',
        yellow: 'medio',
        red: 'alto',
        default: 'N/D'
    };

    const colors = getStatusColor(status);
    const statusText = statusTextMap[status] || statusTextMap.default;

    return (
        <Chip
            variant="outlined"
            sx={{
                borderRadius: 1,
                borderColor: colors.border,
                bgcolor: colors.bg,
                color: colors.text,
                height: 34,
                '& .MuiChip-label': {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    fontSize: '0.775rem',
                    padding: '0 10px'
                }
            }}
            label={
                <>
                    <Box sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: colors.text
                    }} />
                    <Box>
                        <Box component="span" sx={{ mr: 0.5 }}>{typeLabels[type]}</Box>
                        <Box component="span" sx={{ textTransform: 'capitalize' }}>
                            {statusText}
                        </Box>
                    </Box>
                </>
            }
        />
    );
};

export default function FoodDetailCard() {
    const theme = useTheme();
    const { nombre } = useParams();
    const [alimento, setAlimento] = useState(null);
    const [sugeridos, setSugeridos] = useState([]);
    const [image_url, setImage_url] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(`http://localhost:8000/alimentos/detalle_alimento/${encodeURIComponent(nombre)}`)
            .then(res => {
                if (!res.ok) throw new Error("No encontrado");
                return res.json();
            })
            .then(data => {
                console.log("API 返回的完整数据:", data); // 1. 打印完整响应
                console.log("imagen_url 原始值:", data.image_url);
                console.log("imagen_url 原始值:", data.sugeridos);
                setAlimento(data.alimento || null);
                setSugeridos(data.sugeridos || []);
                setImage_url(data.image_url || '');
            })
            .catch(err => console.error("Error:", err))
            .finally(() => setLoading(false));
    }, [nombre]);

    if (loading) return <CircularProgress sx={{ mt: 4 }} />;

    if (!alimento) {
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
                        No se encontró información para el alimento solicitado.
                    </Typography>

                    {sugeridos.length > 0 && (
                        <Box sx={{ mt: 3 }}>
                            <Divider sx={{ mb: 3 }} />
                            <Typography variant="h6" gutterBottom>
                                Alimentos relacionados
                            </Typography>
                            <Box sx={{
                                display: 'flex',
                                gap: 2,
                                flexWrap: 'wrap'
                            }}>
                                {sugeridos.map((item, index) => {
                                    const nombreSugerido = typeof item === 'string' ? item : item.nombre;
                                    return (
                                        <Chip
                                            key={index}
                                            label={nombreSugerido}
                                            component={RouterLink}
                                            to={`/alimentos/detalle_alimento/${encodeURIComponent(nombreSugerido)}`}
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

    return (
        <Card sx={{
            maxWidth: '100%',
            mx: 'auto',
            mt: 4,
            boxShadow: 3,
            borderRadius: 4
        }}>
            <CardContent>
                {alimento && (
                    <>
                        {/* Encabezado */}
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="h4" gutterBottom>
                                {alimento.name_esp}
                            </Typography>

                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                flexWrap: 'wrap'
                            }}>
                                {/* categoria */}
                                <Chip
                                    icon={<LocalDining />}
                                    label={alimento.category_esp}
                                    component={RouterLink}
                                    color="secondary"
                                    to={`/alimentos/categorias/${encodeURIComponent(alimento.category_esp)}`}
                                    clickable
                                />

                                {/* edible */}
                                <Chip
                                    label={`${alimento.edible}% comestible`}
                                    variant="outlined"
                                    sx={{ borderColor: theme.palette.primary.main }}
                                />

                                {/* OMS lights */}
                                <OmsChip type="salt" status={alimento.oms_lights.salt} />
                                <OmsChip type="sugar" status={alimento.oms_lights.sug} />
                                <OmsChip type="fat" status={alimento.oms_lights.total_fat} />
                            </Box>
                        </Box>

                        <Grid container spacing={3}>
                            {/* Imagen */}
                            <Grid item xs={12} md={4}>
                                <Box sx={{
                                    borderRadius: 3,
                                    overflow: 'hidden',
                                    boxShadow: 2,
                                    height: 300,
                                    bgcolor: 'background.paper'
                                }}>
                                    {image_url && (
                                        <img
                                            src={image_url}
                                            alt={alimento.name_esp}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                            }}
                                        />
                                    )}
                                </Box>
                            </Grid>

                            {/* Tabla nutricional */}
                            <Grid item xs={12} md={8}>
                                <Table
                                    sx={{
                                        border: `1px solid ${theme.palette.divider}`,
                                        borderRadius: 2,
                                        overflow: 'hidden',
                                        bgcolor: 'background.paper',
                                        boxShadow: 1,
                                        '& .MuiTableCell-root': {
                                            fontSize: '0.875rem',
                                            py: 1.5,
                                            '&:not(:last-child)': {
                                                borderRight: `1px solid ${theme.palette.divider}`
                                            }
                                        }
                                    }}
                                >
                                    <TableBody>
                                        {/* 主标题 */}
                                        <TableRow sx={{
                                            bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
                                            '& td': {
                                                borderBottom: `2px solid ${theme.palette.divider}`,
                                                py: 2,
                                                fontSize: '1.1rem',
                                                fontWeight: 600
                                            }
                                        }}>
                                            <TableCell colSpan={alimento.edible === 100 ? 3 : 4} align="center">
                                                Composición Nutricional
                                            </TableCell>
                                        </TableRow>

                                        {/* 表头 */}
                                        <TableRow sx={{
                                            bgcolor: 'action.hover',
                                            '& .MuiTableCell-root': {
                                                fontWeight: 600,
                                                borderBottom: `2px solid ${theme.palette.divider}`,
                                                py: 1.5
                                            }
                                        }}>
                                            <TableCell sx={{ pl: 3, width: '30%' }}>Nutriente</TableCell>
                                            <TableCell align="center" sx={{ width: '30%' }}>Componente</TableCell>
                                            <TableCell align="center" sx={{ width: '30%' }}>Por 100g</TableCell>
                                            {alimento.edible !== 100 &&
                                                <TableCell align="center" sx={{ width: '30%' }}>Porción comestible {alimento.edible}g</TableCell>}
                                        </TableRow>

                                        {/* 数据行 */}
                                        {[
                                            {
                                                category: 'Macronutrientes',
                                                values: [
                                                    { nutrient: 'Energía (kcal)', value: alimento.nutritional_info_100g.energy_kcal ?? 'N/D' },
                                                    { nutrient: 'Proteínas (g)', value: alimento.nutritional_info_100g.pro ?? 'N/D' },
                                                    { nutrient: 'Carbohidratos (g)', value: alimento.nutritional_info_100g.car ?? 'N/D' }
                                                ]
                                            },
                                            {
                                                category: 'Grasas',
                                                values: [
                                                    { nutrient: 'Totales (g)', value: alimento.nutritional_info_100g.fats.total_fat ?? 'N/D' },
                                                    { nutrient: 'Saturadas (g)', value: alimento.nutritional_info_100g.fats.sat ?? 'N/D' },
                                                    { nutrient: 'Trans (g)', value: alimento.nutritional_info_100g.fats.trans ?? 'N/D' }
                                                ]
                                            },
                                            {
                                                category: 'Minerales',
                                                values: [
                                                    { nutrient: 'Sodio (mg)', value: alimento.nutritional_info_100g.sod ?? 'N/D' },
                                                    { nutrient: 'Potasio (mg)', value: alimento.nutritional_info_100g.pot ?? 'N/D' },
                                                    { nutrient: 'Calcio (mg)', value: alimento.nutritional_info_100g.cal ?? 'N/D' },
                                                    { nutrient: 'Hierro (mg)', value: alimento.nutritional_info_100g.iron ?? 'N/D' }
                                                ]
                                            },
                                            {
                                                category: 'Otros Componentes',
                                                values: [
                                                    { nutrient: 'Fibra (g)', value: alimento.nutritional_info_100g.fiber ?? 'N/D' },
                                                    { nutrient: 'Colesterol (mg)', value: alimento.nutritional_info_100g.cholesterol ?? 'N/D' }
                                                ]
                                            }
                                        ].map((categoryData, index) => (
                                            categoryData.values.map((row, i) => (
                                                <TableRow
                                                    key={`${index}-${i}`}
                                                    sx={{
                                                        '&:nth-of-type(odd)': {
                                                            bgcolor: theme.palette.mode === 'dark'
                                                                ? 'grey.800'
                                                                : 'grey.50'
                                                        },
                                                        '&:hover': {
                                                            bgcolor: 'action.hover'
                                                        }
                                                    }}
                                                >
                                                    {i === 0 && (
                                                        <TableCell
                                                            rowSpan={categoryData.values.length}
                                                            sx={{
                                                                fontWeight: 600,
                                                                pl: 3,
                                                                bgcolor: theme.palette.mode === 'dark'
                                                                    ? 'grey.700'
                                                                    : 'grey.100',
                                                                borderLeft: `3px solid ${theme.palette.divider}`
                                                            }}
                                                        >
                                                            {categoryData.category}
                                                        </TableCell>
                                                    )}
                                                    <TableCell sx={{ color: 'text.secondary' }}>
                                                        {row.nutrient}
                                                    </TableCell>
                                                    <TableCell align="center">{row.value}</TableCell>
                                                    {alimento.edible !== 100 && (
                                                        <TableCell align="center" sx={{ color: 'success.main' }}>
                                                            {row.value === 'N/D'
                                                                ? 'N/D'
                                                                : Number((row.value * alimento.edible / 100).toFixed(2))}
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            ))
                                        ))}
                                    </TableBody>
                                </Table>
                            </Grid>
                        </Grid >

                        {/* Alimentos relacionados */}
                        {
                            sugeridos.length > 0 && (
                                <Box sx={{ mt: 3 }}>
                                    <Divider sx={{ mb: 3 }} />
                                    <Typography variant="h6" gutterBottom>
                                        Alimentos relacionados
                                    </Typography>
                                    <Box sx={{
                                        display: 'flex',
                                        gap: 2,
                                        flexWrap: 'wrap'
                                    }}>
                                        {sugeridos.map((item, index) => {
                                            const nombreSugerido = typeof item === 'string' ? item : item.nombre;
                                            return (
                                                <Chip
                                                    key={index}
                                                    label={nombreSugerido}
                                                    component={RouterLink}
                                                    to={`/alimentos/detalle_alimento/${encodeURIComponent(nombreSugerido)}`}
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
                    </>
                )
                }
            </CardContent >
        </Card >
    );
}