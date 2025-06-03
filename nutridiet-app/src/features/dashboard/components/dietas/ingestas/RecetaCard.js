// ✅ RecetaCard.jsx
import React from 'react';
import { Box, Typography } from '@mui/material';

const RecetaCard = ({ receta, provided }) => {
    const nombre = receta.nombre || receta.name || 'Sin nombre';

    return (
        <Box
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            sx={{
                border: '1px solid #ddd',
                borderRadius: 1,
                p: 1,
                backgroundColor: 'white',
                boxShadow: 1
            }}
        >
            <Typography variant="subtitle2" fontWeight="bold">{nombre}</Typography>
            <Typography variant="body2">
                Kcal: {receta.kcal} | Pro: {receta.pro} | Carbs: {receta.car}
            </Typography>
        </Box>
    );
};


export default RecetaCard;
