import * as React from 'react';
import { Card, CardActionArea, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

export default function CrearIngestaCard({ onClick }) {
  return (
    <Card
      sx={{
        width: 200,
        height: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        bgcolor: 'background.paper',
        boxShadow: 3,
        '&:hover': { boxShadow: 6 },
      }}
      onClick={onClick}
    >
      <CardActionArea sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <AddIcon color="primary" sx={{ fontSize: 40 }} />
        <Typography variant="h6" color="primary">
          Añadir Ingesta 
        </Typography>
      </CardActionArea>
    </Card>
  );
}
