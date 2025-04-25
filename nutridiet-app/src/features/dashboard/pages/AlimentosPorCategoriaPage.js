import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Grid, Typography, CircularProgress, Box } from '@mui/material';
import UniversalCard from '../components/UniversalCard';
import Dashboard from '../Dashboard';

export default function AlimentosPorCategoriaPage() {
  const { categoria } = useParams();
  const [alimentos, setAlimentos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:8000/alimentos/por_categoria/${encodeURIComponent(categoria)}`)
      .then(res => res.json())
      .then(data => {
        setAlimentos(data.alimentos || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [categoria]);

  if (loading) return <CircularProgress sx={{ mt: 4 }} />;

  return (
    <Dashboard>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Alimentos en la categoría: {categoria}
        </Typography>
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {alimentos.map((nombre) => (
            <Grid item xs={12} sm={6} md={4} key={nombre}>
              <UniversalCard
                title={nombre}
                description="Haz clic para ver detalles"
                image="/img/alimentos/default.jpg"
                buttonLink={`/alimentos/detalle_alimento/${encodeURIComponent(nombre)}`}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Dashboard>
  );
}
