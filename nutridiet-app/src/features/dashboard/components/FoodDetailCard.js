import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Grid,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Divider,
  Card,
  CardContent,
  Typography,
  CircularProgress
} from '@mui/material';
import { mapCategoryToMain } from './FoodGrid'; 

export default function FoodDetailCard() {
    const { nombre } = useParams();
    const [alimento, setAlimento] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sugeridos, setSugeridos] = useState([]);
    const [message, setMessage] = useState('');
    const [imagen_url, setImagen_url] = useState('');

    let categoriaGeneral = '';
    if (alimento) {
        categoriaGeneral = mapCategoryToMain(alimento.category_esp) || alimento.category_esp;
    }

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
                setMessage(data.message || '');
                setImagen_url(data.imagen_url || '');
            })
            .catch(err => console.error("Error:", err))
            .finally(() => setLoading(false));
    }, [nombre]); // 注意监听 nombre

    if (loading) return <CircularProgress sx={{ mt: 4 }} />;
    if (!alimento && sugeridos.length === 0) {
        return <Typography color="error">Alimento no encontrado y no hay sugerencias</Typography>;
    }

    return (
        <Card
            sx={{
                width: '100%',
                mx: 'auto',
                mt: 4,
                p: { xs: 2, sm: 3 },
                boxShadow: 3,
                borderRadius: 2,
            }}
        >
            <CardContent>
                {alimento && (
                    <Grid container spacing={2}>
                        {/* 图片区域 */}
                        <Grid Grid size={{ xs: 12, sm: 6, lg: 3, md: 3 }}>
                            <img
                                src={imagen_url}
                                alt={alimento.name_esp}
                                style={{
                                    width: '100%',
                                    height: 'auto',
                                    borderRadius: '8px',
                                    objectFit: 'cover',
                                }}
                            />
                        </Grid>

                        {/* 信息区域 */}
                        <Grid item xs={12} md={9}>
                            <Typography variant="h5" gutterBottom>
                                {alimento.name_esp}
                            </Typography>
                            <Typography variant="h6">
                                Categoría:&nbsp;
                                <RouterLink
                                    to={`/alimentos/categorias/${encodeURIComponent(categoriaGeneral)}`}
                                    style={{ textDecoration: 'none', color: '#1976d2' }}
                                >
                                    {categoriaGeneral}
                                </RouterLink>
                            </Typography>

                            <Table size="small" sx={{ mt: 2 }}>
                                <TableBody>
                                    <TableRow>
                                        <TableCell><strong>Energía</strong></TableCell>
                                        <TableCell>{alimento.nutritional_info_100g.energy_kcal} kcal</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell><strong>Proteínas</strong></TableCell>
                                        <TableCell>{alimento.nutritional_info_100g.pro} g</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell><strong>Grasas Totales</strong></TableCell>
                                        <TableCell>{alimento.nutritional_info_100g.fats.total_fat} g</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell><strong>Grasas Saturadas</strong></TableCell>
                                        <TableCell>{alimento.nutritional_info_100g.fats.sat} g</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell><strong>Fibra</strong></TableCell>
                                        <TableCell>{alimento.nutritional_info_100g.fiber} g</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell><strong>Sodio</strong></TableCell>
                                        <TableCell>{alimento.nutritional_info_100g.sod} mg</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell><strong>Colesterol</strong></TableCell>
                                        <TableCell>{alimento.nutritional_info_100g.cholesterol} mg</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </Grid>
                    </Grid>
                )}

                {/* 分割线 */}
                <Divider sx={{ my: 3 }} />

                {/* 提示信息 */}
                {message && (
                    <Typography variant="body2" color="textSecondary">
                        {message}
                    </Typography>
                )}

                {sugeridos.length > 0 && (
                    <>
                        <Typography variant="h6" sx={{ mt: 2 }}>
                            Alimentos relacionados:
                        </Typography>
                        <Typography variant="body2">
                            {sugeridos.map((item, index) => {
                                const nombreSugerido = typeof item === 'string' ? item : item.nombre;
                                return (
                                    <span key={index}>
                                        <RouterLink to={`/alimentos/detalle_alimento/${encodeURIComponent(nombreSugerido)}`}>
                                            {nombreSugerido}
                                        </RouterLink>
                                        {index < sugeridos.length - 1 && ', '}
                                    </span>
                                );
                            })}
                        </Typography>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
