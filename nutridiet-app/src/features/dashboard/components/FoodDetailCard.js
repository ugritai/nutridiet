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
    useTheme
} from '@mui/material';

const OmsChip = ({ type, status }) => {
    const typeLabels = {
        salt: 'Sal',
        sugar: 'Azúcar',
        fat: 'Grasa'
    };

    // 添加默认值处理
    const getStatusColor = (status) => {
        const colorMap = {
            red: { bg: '#ffebee', text: '#ff5252', border: '#ff5252' },
            yellow: { bg: '#fff8e1', text: '#ffa000', border: '#ffc107' },
            green: { bg: '#e8f5e9', text: '#4caf50', border: '#4caf50' },
            // 添加默认值
            default: { bg: '#f5f5f5', text: '#616161', border: '#e0e0e0' }
        };
        return colorMap[status] || colorMap.default;
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
                    fontSize: '0.875rem',
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
    const [imagen_url, setImagen_url] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(`http://localhost:8000/alimentos/detalle_alimento/${encodeURIComponent(nombre)}`)
            .then(res => {
                if (!res.ok) throw new Error("No encontrado");
                return res.json();
            })
            .then(data => {
                setAlimento(data.alimento || null);
                setSugeridos(data.sugeridos || []);
                setImagen_url(data.imagen_url || '');
            })
            .catch(err => console.error("Error:", err))
            .finally(() => setLoading(false));
    }, [nombre]);

    if (loading) return <CircularProgress sx={{ mt: 4 }} />;
    
    if (!alimento) {
        // 如果没有找到 aliento，显示推荐食物
        return (
            <Card sx={{
                maxWidth: 1200,
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
                    )}
                </CardContent>
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
                                {/* 分类标签 */}
                                <Chip
                                    label={alimento.category_esp}
                                    component={RouterLink}
                                    to={`/alimentos/categorias/${encodeURIComponent(alimento.category_esp)}`}
                                    clickable
                                    sx={{
                                        borderRadius: 1,
                                        borderColor: theme.palette.primary.main,
                                        color: theme.palette.primary.contrastText,
                                        fontSize: '0.875rem',
                                        height: 34,
                                        '&:hover': {
                                            backgroundColor: theme.palette.primary.light + '20', // 半透明悬停效果
                                            borderColor: theme.palette.primary.dark
                                        },
                                        '& .MuiChip-label': {
                                            padding: '0 12px',
                                            fontWeight: 500
                                        }
                                    }}
                                />

                                {/* 可食用率 */}
                                <Chip
                                    label={`${alimento.edible}% comestible`}
                                    variant="outlined"
                                    sx={{
                                        fontSize: '0.875rem',
                                        height: 34,
                                        borderColor: theme.palette.success.light,
                                        color: theme.palette.success.dark,
                                        bgcolor: `${theme.palette.success.light}30`,
                                        '& .MuiChip-label': {
                                            padding: '0 10px',
                                            fontWeight: 500
                                        }
                                    }}
                                />

                                {/* OMS指示灯组 */}
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
                                    {imagen_url && (
                                        <img
                                            src={imagen_url}
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

                            <Grid item xs={12} md={8}>
                                <Table sx={{
                                    border: `1px solid ${theme.palette.divider}`,
                                    overflow: 'hidden',
                                    '& .MuiTableCell-root': {
                                        padding: '14px 16px',
                                        fontSize: '0.875rem',
                                        color: theme.palette.text.primary,
                                        verticalAlign: 'middle',
                                        '&:not(:last-child)': {
                                            borderRight: `1px solid ${theme.palette.divider}`
                                        },
                                        '&:nth-of-type(1)': {
                                            width: alimento.edible === 100 ? '35%' : '25%',
                                            position: 'relative'
                                        },
                                        '&:nth-of-type(2)': {
                                            width: alimento.edible === 100 ? '45%' : '35%'
                                        },
                                    }
                                }}>
                                    <TableBody>
                                        {/* 主标题 */}
                                        <TableRow sx={{
                                            bgcolor: 'action.hover',
                                            '& td': { borderBottom: `1px solid ${theme.palette.divider}` }
                                        }}>
                                            <TableCell colSpan={alimento.edible === 100 ? 3 : 4} sx={{
                                                textAlign: 'center',
                                                fontWeight: 600,
                                                fontSize: '1rem',
                                            }}>
                                                Composición Nutricional
                                            </TableCell>
                                        </TableRow>

                                        {/* 表头 */}
                                        <TableRow sx={{
                                            bgcolor: theme.palette.grey[100],
                                            '& .MuiTableCell-root': {
                                                fontWeight: 600,
                                                textAlign: 'center',
                                                borderBottom: `1px solid ${theme.palette.divider}`
                                            }
                                        }}>
                                            <TableCell>Nutriente</TableCell>
                                            <TableCell>Componente</TableCell>
                                            <TableCell>Por 100g</TableCell>
                                            {alimento.edible !== 100 && <TableCell>Porción comestible</TableCell>}
                                        </TableRow>

                                        {/* Macronutrientes */}
                                        <TableRow>
                                            <TableCell
                                                rowSpan={3}
                                                sx={{
                                                    bgcolor: theme.palette.grey[50],
                                                    fontWeight: 600,
                                                    borderBottom: `1px solid ${theme.palette.divider}`
                                                }}
                                            >
                                                Macronutrientes
                                            </TableCell>
                                            <TableCell>Energía (kcal)</TableCell>
                                            <TableCell>{alimento.nutritional_info_100g.energy_kcal}</TableCell>
                                            {alimento.edible !== 100 && <TableCell>{(alimento.nutritional_info_100g.energy_kcal * alimento.edible / 100).toFixed(1)}</TableCell>}
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Proteínas (g)</TableCell>
                                            <TableCell>{alimento.nutritional_info_100g.pro}</TableCell>
                                            {alimento.edible !== 100 && (
                                                <TableCell>{(alimento.nutritional_info_100g.pro * alimento.edible / 100).toFixed(1)}</TableCell>
                                            )}
                                        </TableRow>
                                        <TableRow sx={{ '& td': { borderBottom: `1px solid ${theme.palette.divider}` } }} >
                                            <TableCell>Carbohidratos (g)</TableCell>
                                            <TableCell>{alimento.nutritional_info_100g.car}</TableCell>
                                            {alimento.edible !== 100 && (
                                                <TableCell>{(alimento.nutritional_info_100g.car * alimento.edible / 100).toFixed(1)}</TableCell>
                                            )}
                                        </TableRow>

                                        {/* Grasas */}
                                        <TableRow>
                                            <TableCell
                                                rowSpan={3}
                                                sx={{
                                                    bgcolor: theme.palette.grey[50],
                                                    fontWeight: 600,
                                                    borderBottom: `1px solid ${theme.palette.divider}`
                                                }}
                                            >
                                                Grasas
                                            </TableCell>
                                            <TableCell>Totales (g)</TableCell>
                                            <TableCell>{alimento.nutritional_info_100g.fats.total_fat}</TableCell>
                                            {alimento.edible !== 100 && (
                                                <TableCell>{(alimento.nutritional_info_100g.fats.total_fat * alimento.edible / 100).toFixed(1)}</TableCell>
                                            )}
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Saturadas (g)</TableCell>
                                            <TableCell>{alimento.nutritional_info_100g.fats.sat ?? 'N/D'}</TableCell>
                                            {alimento.edible !== 100 && (
                                                <TableCell>{(alimento.nutritional_info_100g.fats.sat * alimento.edible / 100)?.toFixed(1) || 'N/D'}</TableCell>
                                            )}
                                        </TableRow>
                                        <TableRow sx={{ '& td': { borderBottom: `1px solid ${theme.palette.divider}` } }} >
                                            <TableCell>Trans (g)</TableCell>
                                            <TableCell>{alimento.nutritional_info_100g.fats.trans ?? 'N/D'}</TableCell>
                                            {alimento.edible !== 100 && (
                                                <TableCell>{(alimento.nutritional_info_100g.fats.trans * alimento.edible / 100)?.toFixed(1) || 'N/D'}</TableCell>
                                            )}
                                        </TableRow>

                                        {/* Minerales */}
                                        <TableRow>
                                            <TableCell
                                                rowSpan={4}
                                                sx={{
                                                    bgcolor: theme.palette.grey[50],
                                                    fontWeight: 600,
                                                    borderBottom: `1px solid ${theme.palette.divider}`
                                                }}
                                            >
                                                Minerales
                                            </TableCell>
                                            <TableCell>Sodio (mg)</TableCell>
                                            <TableCell>{alimento.nutritional_info_100g.sod}</TableCell>
                                            {alimento.edible !== 100 && (
                                                <TableCell>{(alimento.nutritional_info_100g.sod * alimento.edible / 100).toFixed(1)}</TableCell>
                                            )}
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Potasio (mg)</TableCell>
                                            <TableCell>{alimento.nutritional_info_100g.pot}</TableCell>
                                            {alimento.edible !== 100 && (
                                                <TableCell>{(alimento.nutritional_info_100g.pot * alimento.edible / 100).toFixed(1)}</TableCell>
                                            )}
                                        </TableRow>
                                        <TableRow>
                                            <TableCell>Calcio (mg)</TableCell>
                                            <TableCell>{alimento.nutritional_info_100g.cal}</TableCell>
                                            {alimento.edible !== 100 && (
                                                <TableCell>{(alimento.nutritional_info_100g.cal * alimento.edible / 100).toFixed(1)}</TableCell>
                                            )}
                                        </TableRow>
                                        <TableRow sx={{ '& td': { borderBottom: `1px solid ${theme.palette.divider}` } }} >
                                            <TableCell>Hierro (mg)</TableCell>
                                            <TableCell>{alimento.nutritional_info_100g.iron}</TableCell>
                                            {alimento.edible !== 100 && (
                                                <TableCell>{(alimento.nutritional_info_100g.iron * alimento.edible / 100).toFixed(1)}</TableCell>
                                            )}
                                        </TableRow>

                                        {/* Otros Componentes */}
                                        <TableRow>
                                            <TableCell
                                                rowSpan={2}
                                                sx={{
                                                    bgcolor: theme.palette.grey[50],
                                                    fontWeight: 600,
                                                    borderBottom: `1px solid ${theme.palette.divider}`
                                                }}
                                            >
                                                Otros Componentes
                                            </TableCell>
                                            <TableCell>Fibra (g)</TableCell>
                                            <TableCell>{alimento.nutritional_info_100g.fiber}</TableCell>
                                            {alimento.edible !== 100 && (
                                                <TableCell>{(alimento.nutritional_info_100g.fiber * alimento.edible / 100).toFixed(1)}</TableCell>
                                            )}
                                        </TableRow>
                                        <TableRow sx={{ '& td': { borderBottom: `1px solid ${theme.palette.divider}` } }} >
                                            <TableCell>Colesterol (mg)</TableCell>
                                            <TableCell>{alimento.nutritional_info_100g.cholesterol}</TableCell>
                                            {alimento.edible !== 100 && (
                                                <TableCell>{(alimento.nutritional_info_100g.cholesterol * alimento.edible / 100).toFixed(1)}</TableCell>
                                            )}
                                        </TableRow>
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