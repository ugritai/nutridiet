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

export default function ListaIngestas({ ingestas, onEdit, onDelete }) {
  const [filtroTipo, setFiltroTipo] = useState('todas');
  const [expandidaId, setExpandidaId] = useState(null);

  const tiposDisponibles = useMemo(() => {
    const tipos = new Set(ingestas.map(i => i.intake_type));
    return Array.from(tipos);
  }, [ingestas]);

  const ingestasFiltradas = useMemo(() => {
    if (filtroTipo === 'todas') return ingestas;
    return ingestas.filter(i => i.intake_type === filtroTipo);
  }, [ingestas, filtroTipo]);
  

  const toggleExpand = (id) => {
    setExpandidaId(prev => prev === id ? null : id);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <FormControl sx={{ mb: 2, minWidth: 200 }} size="small">
        <InputLabel>Filtrar por tipo</InputLabel>
        <Select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          label="Filtrar por tipo"
        >
          <MenuItem value="todas">Todas</MenuItem>
          {tiposDisponibles.map(tipo => (
            <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {ingestasFiltradas.map((ingesta) => {
        const expandida = expandidaId === ingesta._id;

        return (
          <Card key={ingesta._id} sx={{ width: '100%', mb: 2 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6">{ingesta.intake_name} ({ingesta.intake_type})</Typography>
                <Stack direction="row" spacing={1}>
                  <IconButton onClick={() => onEdit?.(ingesta)} size="small"><EditIcon /></IconButton>
                  <IconButton onClick={() => onDelete?.(ingesta)} size="small"><DeleteIcon /></IconButton>
                  <IconButton onClick={() => toggleExpand(ingesta._id)} size="small">
                    <ExpandMoreIcon
                      sx={{
                        transform: expandida ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s',
                      }}
                    />
                  </IconButton>
                </Stack>
              </Stack>

              <Typography variant="body2" color="text.secondary">
                {ingesta.intake_universal ? 'Ingesta universal' : 'Ingesta personalizada'}
              </Typography>

              <Collapse in={expandida} timeout="auto" unmountOnExit>
                <Divider sx={{ my: 1 }} />
                <Stack spacing={0.7}>
                  {(ingesta.recipes || []).map((receta, i) => (
                    <Typography key={i} variant="body2" color="text.secondary">
                      <strong>{receta.recipe_type}:</strong> {receta.name} | {receta.kcal} kcal, {receta.pro}g prot, {receta.car}g carb
                    </Typography>
                  ))}
                </Stack>
              </Collapse>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
}
