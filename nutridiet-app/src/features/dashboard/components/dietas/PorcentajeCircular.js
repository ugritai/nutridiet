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
            <CircularProgress
                variant="determinate"
                value={porcentaje > 100 ? 100 : porcentaje}
                size={70}
                thickness={5}
                sx={{ color }}
            />
            <Box
                sx={{
                    position: 'relative',
                    top: '-58px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    color,
                    userSelect: 'none',
                }}
            >
                {porcentaje.toFixed(1)}%
            </Box>
            <Typography variant="body2" sx={{ userSelect: 'none', textAlign: 'center' }}>
                {label}: {esNumero(valor) ? valor.toFixed(2) : '--'}
            </Typography>
        </Box>
    );
}
