import React from 'react';
import { Box, Typography } from '@mui/material';

function capitalizarPrimeraLetra(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  

const RecetaCard = ({ receta, provided }) => {

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
            style={provided.draggableProps.style}
        >
            <Typography variant="subtitle2" fontWeight="bold">
                {capitalizarPrimeraLetra(receta.name)}
            </Typography>
            <Typography variant="body2">
                Kcal: {receta.kcal} | Pro: {receta.pro} | Carbs: {receta.car}
            </Typography>
        </Box>
    );
};



export default RecetaCard;
