import React from 'react';
import {
  Grid,
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

export default function RecipeNutritionTable({ nutritionalInfo, raciones = 1, por_porcion = true }) {
  const theme = useTheme();

  const dataMap = [
    {
      category: 'Macronutrientes',
      values: [
        { nutrient: 'Energía (kcal)', keys: ['energy_kcal', 'energy_kj'] },
        { nutrient: 'Proteínas (g)', keys: ['pro', 'proteins_g'] },
        { nutrient: 'Carbohidratos (g)', keys: ['car', 'carbohydrates_g'] },
        { nutrient: 'Fibra (g)', keys: ['fiber', 'fiber_g', 'fiber_g'] },
        { nutrient: 'Agua (g)', keys: ['wat', 'water_g'] }
      ]
    },
    {
      category: 'Grasas',
      values: [
        { nutrient: 'Grasas totales (g)', keys: ['fats.total_fat', 'fats_g'] },
        { nutrient: 'Grasas saturadas (g)', keys: ['fats.sat', 'fats_sat_g'] },
        { nutrient: 'Grasas trans (g)', keys: ['fats.trans', 'fats_trans_g'] },
        { nutrient: 'Colesterol (mg)', keys: ['cholesterol', 'cholesterol_mg'] }
      ]
    },
    {
      category: 'Vitaminas',
      values: [
        { nutrient: 'Vitamina A (µg)', keys: ['vitamin_a_ug', 'vitamin_a_mcg'] },
        { nutrient: 'Vitamina C (mg)', keys: ['vitamin_c_mg', 'vitamin_c'] },
        { nutrient: 'Vitamina E (mg)', keys: ['vitamin_e_mg', 'vitamin_e'] },
        { nutrient: 'Vitamina B1 (mg)', keys: ['vitamin_b1_mg', 'vitamin_b1'] },
        { nutrient: 'Vitamina B2 (mg)', keys: ['vitamin_b2_mg', 'vitamin_b2'] },
        { nutrient: 'Vitamina B3 (mg)', keys: ['vitamin_b3_mg', 'vitamin_b3'] },
        { nutrient: 'Vitamina B6 (mg)', keys: ['vitamin_b6_mg', 'vitamin_b6'] },
        { nutrient: 'Vitamina B9 (µg)', keys: ['vitamin_b9_ug', 'folic_acid_ug', 'folates_ug'] }
      ]
    },
    {
      category: 'Minerales',
      values: [
        { nutrient: 'Calcio (mg)', keys: ['calcium_mg', 'cal'] },
        { nutrient: 'Hierro (mg)', keys: ['iron', 'iron_mg'] },
        { nutrient: 'Magnesio (mg)', keys: ['magnesium_mg', 'mag'] },
        { nutrient: 'Fósforo (mg)', keys: ['phosphorus_mg', 'phos'] },
        { nutrient: 'Potasio (mg)', keys: ['potassium_mg', 'pot'] },
        { nutrient: 'Sodio (mg)', keys: ['sodium_mg', 'sod'] },
        { nutrient: 'Zinc (mg)', keys: ['zinc_mg', 'zn'] },
        { nutrient: 'Cobre (mg)', keys: ['copper_mg', 'cu'] },
        { nutrient: 'Cobalto (µg)', keys: ['cobalt_ug'] },
        { nutrient: 'Flúor (µg)', keys: ['fluoride_ug'] }
      ]
    }
  ];

  function obtenerValorNutricional(nutritional_info, keys) {
    if (!nutritional_info) return 'N/D';
    for (const key of keys) {
      if (nutritional_info[key] !== undefined && nutritional_info[key] !== null) {
        return nutritional_info[key];
      }
    }
    return 'N/D';
  }

  const format = val => (typeof val === 'number' ? val.toFixed(2) : val);

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
              <TableRow
                sx={{
                  bgcolor: 'action.hover',
                  '& .MuiTableCell-root': {
                    fontWeight: 600,
                    borderBottom: `2px solid ${theme.palette.divider}`,
                    py: 1.5
                  }
                }}
              >
                <TableCell sx={{ pl: 3, width: '25%' }}>Categoría</TableCell>
                <TableCell sx={{ width: '25%' }}>Nutriente</TableCell>
                <TableCell align="center" sx={{ width: '25%' }}>
                  Total receta
                </TableCell>
                {por_porcion && (
                  <TableCell align="center" sx={{ width: '25%' }}>
                    Por ración
                  </TableCell>
                )}
              </TableRow>

              {dataMap.map((group, i) => {
                // Filtrar valores válidos (no 0 ni 'N/D')
                const filasValidas = group.values.filter(item => {
                  const valTotal = obtenerValorNutricional(nutritionalInfo, item.keys);
                  return valTotal !== 'N/D' && valTotal !== 0 && valTotal !== null && valTotal !== undefined;
                });

                if (filasValidas.length === 0) return null;

                return filasValidas.map((item, j) => {
                  const valTotal = obtenerValorNutricional(nutritionalInfo, item.keys);
                  const valPorcion = typeof valTotal === 'number' && por_porcion ? (valTotal / raciones).toFixed(2) : 'N/D';

                  return (
                    <TableRow key={`${i}-${j}`} sx={{}}>
                      {j === 0 && (
                        <TableCell
                          rowSpan={filasValidas.length}
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
                });
              })}
            </TableBody>
          </Table>
        </AccordionDetails>
      </Accordion>
    </Grid>
  );
}
