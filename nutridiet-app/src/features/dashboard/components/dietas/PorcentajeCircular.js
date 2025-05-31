import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';

export default function PorcentajeCircular({ label, valor, maximo }) {
    const esNumero = (n) => typeof n === 'number' && !isNaN(n);

    const porcentaje = esNumero(valor) && esNumero(maximo) && maximo !== 0
        ? (valor / maximo) * 100
        : 0;

    const color = porcentaje > 100 ? 'error.main' : 'primary.main';

    return (
        <Box
            sx={{
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                mx: 1,
                minWidth: 90,
            }}
        >
            {/* Círculo contenedor con posición relativa */}
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                {/* Fondo gris claro */}
                <CircularProgress
                    variant="determinate"
                    value={100}
                    size={70}
                    thickness={5}
                    sx={{ color: 'grey.300' }}
                />
                {/* Progreso real */}
                <CircularProgress
                    variant="determinate"
                    value={porcentaje > 100 ? 100 : porcentaje}
                    size={70}
                    thickness={5}
                    sx={{ 
                        color,
                        position: 'absolute',
                        left: 0,
                    }}
                />
                {/* Texto centrado */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        color,
                        userSelect: 'none',
                    }}
                >
                    {porcentaje.toFixed(1)}%
                </Box>
            </Box>

            <Typography variant="body2" sx={{ userSelect: 'none', textAlign: 'center', mt: 1 }}>
                {label}: {esNumero(valor) ? valor.toFixed(2) : '--'}
            </Typography>
        </Box>
    );
}
