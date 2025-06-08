import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Collapse,
  IconButton,
  Stack,
  Divider,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export default function IngestaCard({ ingesta, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  const handleExpandClick = () => setExpanded(!expanded);
  const handleEditClick = () => onEdit?.(ingesta);
  const handleDeleteClick = () => onDelete?.(ingesta);

  if (!ingesta) return null;

  return (
    <Card sx={{ width: '100%', mb: 2 }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6" component="div">
            {ingesta.intake_name} ({ingesta.intake_type})
          </Typography>
          <Stack direction="row" spacing={1}>
            <IconButton onClick={handleEditClick} aria-label="editar" size="small">
              <EditIcon />
            </IconButton>
            <IconButton onClick={handleDeleteClick} aria-label="eliminar" size="small">
              <DeleteIcon />
            </IconButton>
            <IconButton onClick={handleExpandClick} aria-label="expandir" size="small">
              <ExpandMoreIcon
                sx={{
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s',
                }}
              />
            </IconButton>
          </Stack>
        </Stack>

        <Typography variant="body2" color="text.secondary">
          {ingesta.intake_universal ? 'Ingesta universal' : 'Ingesta personalizada'}
        </Typography>

        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Divider sx={{ my: 1 }} />
          <Stack spacing={0.7}>
            {(ingesta.recipes || []).map((receta, i) => (
              <Typography key={i} variant="body2" color="text.secondary">
                <strong>{receta.recipe_type}:</strong> {receta.name} | {receta.kcal} kcal, {receta.pro}g proteína, {receta.car}g carbohidratos
              </Typography>
            ))}
          </Stack>
        </Collapse>
      </CardContent>
    </Card>
  );
}
