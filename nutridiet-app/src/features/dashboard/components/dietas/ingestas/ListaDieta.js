import React, { useMemo, useState } from 'react';
import {
    Card,
    CardContent,
    Typography,
    IconButton,
    Box,
    Divider,
    Stack,
    Collapse,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

export default function ListaDietas({ dietas, onEdit, onDelete, detallesDieta, onExpand }) {
    const [filtro, setFiltro] = useState('todas');
    const [expandidaId, setExpandidaId] = useState(null);
    const hoy = dayjs();

    const dietasFiltradas = useMemo(() => {
        return dietas.filter(dieta => {
            const start = dayjs(dieta.start_date);
            const end = dayjs(dieta.end_date);

            if (filtro === 'mes_actual') {
                return start.month() === hoy.month() && start.year() === hoy.year();
            }

            if (filtro === 'mes_pasado') {
                const mesPasado = hoy.subtract(1, 'month');
                return start.month() === mesPasado.month() && start.year() === mesPasado.year();
            }

            if (filtro !== 'todas') {
                return start.year() === parseInt(filtro);
            }

            return true;
        });
    }, [dietas, filtro]);


    const añosDisponibles = useMemo(() => {
        const años = new Set(dietas.map(d => dayjs(d.start_date).year()));
        return Array.from(años).sort((a, b) => b - a);
    }, [dietas]);

    const toggleExpand = async (id) => {
        const nueva = expandidaId === id ? null : id;
        setExpandidaId(nueva);
        if (nueva) onExpand?.(nueva);
    };

    return (
        <Box sx={{ mt: 2 }}>
            <FormControl sx={{ mb: 2, minWidth: 200 }} size="small">
                <InputLabel>Filtrar por periodo</InputLabel>
                <Select
                    value={filtro}
                    label="Filtrar por periodo"
                    onChange={(e) => setFiltro(e.target.value)}
                >
                    <MenuItem value="todas">Todas</MenuItem>
                    <MenuItem value="mes_actual">Mes actual</MenuItem>
                    <MenuItem value="mes_pasado">Mes pasado</MenuItem>
                    {añosDisponibles.map(a => (
                        <MenuItem key={a} value={String(a)}>{a}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            {dietasFiltradas.map(dieta => {
                const hoySinHora = hoy.startOf('day');
                const activa = hoySinHora.isSameOrAfter(dayjs(dieta.start_date).startOf('day')) &&
                    hoySinHora.isSameOrBefore(dayjs(dieta.end_date).startOf('day'));
                const detalle = detallesDieta[dieta._id];
                const expandida = expandidaId === dieta._id;

                return (
                    <Card key={dieta._id} sx={{ width: '100%', mb: 2, bgcolor: activa ? '#e0f7fa' : 'inherit' }}>
                        <CardContent>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                                <Typography variant="h6">{dieta.name || dieta.nombre_dieta}</Typography>
                                <Stack direction="row" spacing={1}>
                                    <IconButton onClick={() => onEdit?.(dieta)} size="small"><EditIcon /></IconButton>
                                    <IconButton onClick={() => onDelete?.(dieta)} size="small"><DeleteIcon /></IconButton>
                                    <IconButton onClick={() => toggleExpand(dieta._id)} size="small">
                                        <ExpandMoreIcon
                                            sx={{
                                                transform: expandida ? 'rotate(180deg)' : 'rotate(0deg)',
                                                transition: 'transform 0.3s',
                                            }}
                                        />
                                    </IconButton>
                                </Stack>
                            </Stack>

                            {activa && (
                                <Typography variant="body2" color="text.secondary">
                                    (Dieta actual)
                                </Typography>
                            )}

                            <Collapse in={expandida} timeout="auto" unmountOnExit>
                                <Divider sx={{ my: 1 }} />
                                {detalle ? (
                                    <Stack spacing={1}>
                                        {detalle.days.map((dia, idx) => (
                                            <Box key={idx}>
                                                <Typography fontWeight={600}>
                                                    Día {idx + 1} - {dayjs(dia.date).format('DD/MM/YYYY')}
                                                </Typography>
                                                {(dia.intakes || []).map((ing, i) => (
                                                    <Box key={i} sx={{ pl: 2 }}>
                                                        <Typography fontWeight={500}>{ing.intake_type}</Typography>
                                                        {(ing.recipes || []).map((r, ri) => (
                                                            <Typography key={ri} variant="body2" sx={{ pl: 2 }}>
                                                                - {r.recipe_type}: {r.name}
                                                            </Typography>
                                                        ))}
                                                    </Box>
                                                ))}
                                                {idx < detalle.days.length - 1 && <Divider sx={{ my: 1 }} />}
                                            </Box>
                                        ))}
                                    </Stack>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        Cargando detalle...
                                    </Typography>
                                )}
                            </Collapse>
                        </CardContent>
                    </Card>
                );
            })}
        </Box>
    );
}
