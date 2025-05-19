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
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export default function PacienteCard({ paciente, onEdit }) {
  const [expanded, setExpanded] = useState(false);

  const handleExpandClick = () => setExpanded(!expanded);
  const handleEditClick = () => {
    if (onEdit) {
      onEdit(paciente);
    }
  };

  if (!paciente) return null;

  return (
    <Card sx={{ width: '100%', marginBottom: 2 }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6" component="div">
            {paciente.name}
          </Typography>
          <Stack direction="row" spacing={1}>
            <IconButton
              onClick={handleEditClick}
              aria-label="editar paciente"
              size="small"
            >
              <EditIcon />
            </IconButton>
            <IconButton
              onClick={handleExpandClick}
              aria-expanded={expanded}
              aria-label="mostrar más"
              size="small"
            >
              <ExpandMoreIcon
                sx={{
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s',
                }}
              />
            </IconButton>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2" color="text.secondary">
            Email: {paciente.email}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Género: {paciente.gender}
          </Typography>
        </Stack>

        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Divider sx={{ my: 1 }} />
          <Stack spacing={0.7}>
            <Typography variant="body2" color="text.secondary">
              Fecha de nacimiento: {new Date(paciente.bornDate).toLocaleDateString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Altura: {paciente.height} cm
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Peso: {paciente.weight} kg
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Nivel de actividad: {paciente.activityLevel}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              TMB: {paciente.tmb} kcal
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Requerimiento kcal: {paciente.restrictionsKcal} kcal
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Proteínas: {Number(paciente.dailyProIntake).toFixed(2)} g
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Carbohidratos: {paciente.dailyCalIntake} g
            </Typography>
          </Stack>
        </Collapse>
      </CardContent>
    </Card>
  );
}
