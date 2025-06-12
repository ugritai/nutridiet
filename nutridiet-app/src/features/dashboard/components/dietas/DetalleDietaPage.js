import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Box, Typography, Card, CardContent, Button, CircularProgress, Divider,
    Stack, Paper, IconButton, Tooltip
} from '@mui/material';
import Dashboard from '../../Dashboard';
import { fetchWithAuth } from '../api';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function DetalleDietaPage() {
    const location = useLocation();
    const dietaId = location.state?.dietaId;
    const navigate = useNavigate();
    const [dieta, setDieta] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!dietaId) return;
        const fetchDieta = async () => {
            try {
                const res = await fetchWithAuth(`/planificacion_dietas/ver_dieta_detalle/${dietaId}`);
                if (!res.ok) throw new Error('No se pudo cargar la dieta');
                const data = await res.json();
                setDieta(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDieta();
    }, [dietaId]);
    const handleDescargarPDF = () => {
        if (!dieta) return;

        const doc = new jsPDF();
        const nombreArchivo = dieta.name.replace(/\s+/g, '_');

        doc.setFontSize(16);
        doc.text(`Plan de dieta: ${dieta.name}`, 14, 20);
        doc.setFontSize(12);
        doc.text(`Paciente: ${dieta.patient_name}`, 14, 30);
        doc.text(`Nutricionista: ${dieta.nutritionist_email}`, 14, 37);
        doc.text(`Fechas: ${new Date(dieta.start_date).toLocaleDateString()} - ${new Date(dieta.end_date).toLocaleDateString()}`, 14, 44);

        let y = 50;
        let totalGlobalKcal = 0;
        let totalGlobalPro = 0;
        let totalGlobalCar = 0;

        dieta.days.forEach((dia, idx) => {
            const fecha = new Date(dia.date).toLocaleDateString('es-ES');
            doc.setFontSize(13);
            doc.text(`Día ${idx + 1} - ${fecha}`, 14, y);
            y += 6;

            let totalDiaKcal = 0;
            let totalDiaPro = 0;
            let totalDiaCar = 0;

            // Agrupar recetas por ingesta con info para rowSpan
            const recetasAgrupadas = dia.intakes.flatMap((ingesta) => {
                const recetas = ingesta.recipes?.length > 0 ? ingesta.recipes : [{
                    name: '—',
                    recipe_type: '—',
                    kcal: 0,
                    pro: 0,
                    car: 0
                }];

                return recetas.map((receta, i) => {
                    const kcal = receta.kcal || 0;
                    const pro = receta.pro || 0;
                    const car = receta.car || 0;

                    totalDiaKcal += kcal;
                    totalDiaPro += pro;
                    totalDiaCar += car;

                    return {
                        ingestaKey: `${ingesta.intake_type} (${ingesta.intake_name})`,
                        showIngesta: i === 0,
                        rowSpan: recetas.length,
                        recipe_type: receta.recipe_type,
                        recipe_name: receta.name,
                        kcal,
                        pro,
                        car,
                        isTotal: false
                    };
                });
            });

            // Acumular al total global
            totalGlobalKcal += totalDiaKcal;
            totalGlobalPro += totalDiaPro;
            totalGlobalCar += totalDiaCar;

            // Añadir fila TOTAL DEL DÍA al final de la tabla del día
            recetasAgrupadas.push({
                ingestaKey: { content: 'TOTAL DEL DÍA', colSpan: 1, styles: { halign: 'right', fontStyle: 'bold' } },
                recipe_type: '',
                recipe_name: '',
                kcal: totalDiaKcal,
                pro: totalDiaPro,
                car: totalDiaCar,
                isTotal: true
            });

            // Renderizar tabla del día
            autoTable(doc, {
                startY: y,
                head: [['Ingesta', 'Tipo', 'Receta', 'Kcal', 'Proteínas', 'Carbohidratos']],
                body: recetasAgrupadas.map(r => [
                    r.ingestaKey,
                    r.recipe_type,
                    r.recipe_name,
                    r.kcal.toFixed(2),
                    r.pro.toFixed(2),
                    r.car.toFixed(2),
                ]),
                theme: 'striped',
                headStyles: { fillColor: [63, 81, 181], textColor: 255 },
                alternateRowStyles: { fillColor: [245, 245, 245] },
                margin: { left: 14, right: 14 },
                styles: { fontSize: 10 },
                didParseCell: function (data) {
                    const row = recetasAgrupadas[data.row.index];

                    if (data.column.index === 0) {
                        // Ingesta (solo mostrar en la primera receta del grupo)
                        if (row.isTotal || !row.showIngesta) {
                            data.cell.text = '';
                        }
                    }
                },
                didDrawPage: (data) => {
                    y = data.cursor.y + 10;
                }
            });
        });

        doc.save(`${nombreArchivo}.pdf`);
    };


    if (loading) {
        return (
            <Dashboard>
                <Box sx={{ p: 4, textAlign: 'center' }}>
                    <CircularProgress />
                </Box>
            </Dashboard>
        );
    }

    if (!dieta) {
        return (
            <Dashboard>
                <Typography color="error">Dieta no encontrada</Typography>
            </Dashboard>
        );
    }

    return (
        <Dashboard>
            <Box sx={{ p: 3 }}>
                <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    mb={2}
                    sx={{ gap: 2 }} // Aquí defines el espacio horizontal entre elementos
                >
                    <Typography variant="h4">{dieta.name}</Typography>
                    <Tooltip title="Descargar dieta en PDF">
                        <IconButton onClick={handleDescargarPDF} color="primary">
                            <PictureAsPdfIcon />
                        </IconButton>
                    </Tooltip>
                </Box>

                <Typography variant="subtitle1">Paciente: <strong>{dieta.patient_name}</strong></Typography>
                <Typography variant="subtitle1">Nutricionista: <strong>{dieta.nutritionist_email}</strong></Typography>
                <Typography variant="subtitle1">
                    Fecha: {new Date(dieta.start_date).toLocaleDateString()} - {new Date(dieta.end_date).toLocaleDateString()}
                </Typography>

                <Divider sx={{ my: 3 }} />

                {dieta.days.map((dia, i) => (
                    <Paper key={i} sx={{ mb: 4, p: 2 }} elevation={2}>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Día {i + 1} - {new Date(dia.date).toLocaleDateString()}
                        </Typography>

                        {dia.intakes.map((ingesta, j) => (
                            <Card key={j} sx={{ mb: 2 }}>
                                <CardContent>
                                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500 }}>
                                        {ingesta.intake_type} ({ingesta.intake_name})
                                    </Typography>

                                    <Stack spacing={1}>
                                        {ingesta.recipes?.map((receta, k) => (
                                            <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography>{receta.name}</Typography>
                                                <Button
                                                    size="small"
                                                    onClick={() => {
                                                        navigate(`/recetas/detalle_receta/${encodeURIComponent(receta.name)}`, {
                                                            state: {
                                                                desdeDieta: true,
                                                                dietaId: dieta._id,
                                                                dietaNombre: dieta.name
                                                            }
                                                        });
                                                    }}
                                                >
                                                    Ver receta
                                                </Button>
                                            </Box>
                                        ))}
                                    </Stack>
                                </CardContent>
                            </Card>
                        ))}
                    </Paper>
                ))}
            </Box>
        </Dashboard>
    );
}
