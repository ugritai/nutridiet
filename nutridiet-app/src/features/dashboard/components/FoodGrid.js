import * as React from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import UniversalCard from './UniversalCard'; // 你刚刚改的组件

export default function FoodGrid() {
  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' } }}>
      {/* cards */}
      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        {/* Título */}
      </Typography>
      <Grid container
        spacing={2}
        columns={12}
        sx={{ mb: (theme) => theme.spacing(2) }}
      >
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <UniversalCard
            title="Verduras"
            description="Alimentos vegetales ricos en nutrientes."
            image="/img/alimentos/verduras.jpg"
            buttonLink="/resultadosalimentos?tipo=Verduras"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <UniversalCard
            title="Legumbres"
            description="Fuente de proteína vegetal como lentejas y garbanzos."
            image="/img/alimentos/legumbres.jpg"
            buttonLink="/resultadosalimentos?tipo=Legumbres"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <UniversalCard
            title="Carnes"
            description="Productos cárnicos de origen animal."
            image="/img/alimentos/carnes.jpg"
            buttonLink="/resultadosalimentos?tipo=Carnes"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <UniversalCard
            title="Frutas"
            description="Alimentos dulces y saludables."
            image="/img/alimentos/frutas.webp"
            buttonLink="/resultadosalimentos?tipo=Frutas"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <UniversalCard
            title="Pescados"
            description="Ricos en omega-3 y proteínas."
            image="/img/alimentos/pescados.jpg"
            buttonLink="/resultadosalimentos?tipo=Pescados"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <UniversalCard
            title="Lácteos"
            description="Productos derivados de la leche."
            image="/img/alimentos/lacteos.jpg"
            buttonLink="/resultadosalimentos?tipo=Lácteos"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <UniversalCard
            title="Cereales"
            description="Granos como arroz, maíz y trigo."
            image="/img/alimentos/cereales.jpg"
            buttonLink="/resultadosalimentos?tipo=Cereales"
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <UniversalCard
            title="Bebidas"
            description="Incluye agua, jugos, refrescos y más."
            image="/img/alimentos/bebidas.jpg"
            buttonLink="/resultadosalimentos?tipo=Bebidas"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <UniversalCard
            title="Dulces"
            description="Azúcar, chocolate y productos afines."
            image="/img/alimentos/dulces.jpg"
            buttonLink="/resultadosalimentos?tipo=Dulces"
          />
        </Grid>
      </Grid>
    </Box>
  );
}
