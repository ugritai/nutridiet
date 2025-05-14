import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Grid,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableRow,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
    useTheme
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TableChartIcon from '@mui/icons-material/TableChart';

export default function NutritionTable() {
    const theme = useTheme();
    const { nombre } = useParams();
    const [recetaData, setRecetaData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(`http://localhost:8000/recetas/${encodeURIComponent(nombre)}/nutricion`)
            .then(res => {
                if (!res.ok) throw new Error("No encontrado");
                return res.json();
            })
            .then(data => {
                console.log("API 返回的完整数据:", data);
                setRecetaData(data);
            })
            .catch(err => console.error("Error:", err))
            .finally(() => setLoading(false));
    }, [nombre]);

    if (loading) return <CircularProgress sx={{ mt: 4 }} />;
    if (!recetaData) return null;

    const { receta, por_porcion, raciones, valores_nutricionales: info } = recetaData;

    const dataMap = [
        {
            category: 'Macronutrientes',
            values: [
                { nutrient: 'Energía (kcal)', key: 'energy_kcal' },
                { nutrient: 'Proteínas (g)', key: 'pro' },
                { nutrient: 'Carbohidratos (g)', key: 'car' }
            ]
        },
        {
            category: 'Grasas',
            values: [
                { nutrient: 'Totales (g)', key: 'fats.total_fat' },
                { nutrient: 'Saturadas (g)', key: 'fats.sat' },
                { nutrient: 'Trans (g)', key: 'fats.trans' }
            ]
        },
        {
            category: 'Minerales',
            values: [
                { nutrient: 'Sodio (mg)', key: 'sod' },
                { nutrient: 'Potasio (mg)', key: 'pot' },
                { nutrient: 'Calcio (mg)', key: 'cal' },
                { nutrient: 'Hierro (mg)', key: 'iron' }
            ]
        },
        {
            category: 'Otros Minerales y Componentes',
            values: [
                { nutrient: 'Magnesio (mg)', key: 'mag' },
                { nutrient: 'Fósforo (mg)', key: 'phos' },
                { nutrient: 'Sal (mg)', key: 'salt' },
                { nutrient: 'Agua (g)', key: 'wat' },
                { nutrient: 'Fibra (g)', key: 'fiber' },
                { nutrient: 'Colesterol (mg)', key: 'cholesterol' }
            ]
        }
    ];

    const getValue = key => key.split('.').reduce((obj, part) => obj?.[part], info) ?? 'N/D';
    const format = val => typeof val === 'number' ? val.toFixed(2) : val;

    return (
        <Grid item xs={12}>
            <Accordion sx={{ borderRadius: 3, boxShadow: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <TableChartIcon sx={{ mr: 1, color: 'primary' }} />
                    <Typography variant="h6" fontWeight={600}>
                        Composición Nutricional
                    </Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Table
                        sx={{
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 2,
                            overflow: 'hidden',
                            bgcolor: 'background.paper',
                            '& .MuiTableCell-root': {
                                fontSize: '0.875rem',
                                py: 1.5
                            }
                        }}
                    >
                        <TableBody>
                            <TableRow sx={{
                                bgcolor: 'action.hover',
                                '& .MuiTableCell-root': {
                                    fontWeight: 600,
                                    borderBottom: `2px solid ${theme.palette.divider}`,
                                    py: 1.5
                                }
                            }}>
                                <TableCell sx={{ pl: 3, width: '25%' }}>Categoría</TableCell>
                                <TableCell sx={{ width: '25%' }}>Nutriente</TableCell>
                                <TableCell align="center" sx={{ width: '25%' }}>Total receta</TableCell>
                                {por_porcion && (
                                    <TableCell align="center" sx={{ width: '25%' }}>Por ración</TableCell>
                                )}
                            </TableRow>

                            {dataMap.map((group, i) =>
                                group.values.map((item, j) => {
                                    const valTotal = getValue(item.key);
                                    const valPorcion = typeof valTotal === 'number' && por_porcion
                                        ? (valTotal / raciones).toFixed(2)
                                        : 'N/D';

                                    return (
                                        <TableRow
                                            key={`${i}-${j}`}
                                            sx={{
                                                '&:nth-of-type(odd)': {
                                                    bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.50'
                                                },
                                                '&:hover': { bgcolor: 'action.hover' }
                                            }}
                                        >
                                            {j === 0 && (
                                                <TableCell
                                                    rowSpan={group.values.length}
                                                    sx={{
                                                        fontWeight: 600,
                                                        pl: 3,
                                                        bgcolor: theme.palette.mode === 'dark' ? 'grey.700' : 'grey.100',
                                                        borderLeft: `3px solid ${theme.palette.divider}`
                                                    }}
                                                >
                                                    {group.category}
                                                </TableCell>
                                            )}
                                            <TableCell>{item.nutrient}</TableCell>
                                            <TableCell align="center">{format(valTotal)}</TableCell>
                                            {por_porcion && (
                                                <TableCell align="center" sx={{ color: 'success.main' }}>
                                                    {valPorcion}
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </AccordionDetails>
            </Accordion>
        </Grid>
    );
}
