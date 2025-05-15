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
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export default function PacienteCard({ paciente }) {
  const [expanded, setExpanded] = useState(false);

  const handleExpandClick = () => setExpanded(!expanded);

  if (!paciente) return null;

  return (
    <Card sx={{ width: '100%', marginBottom: 2 }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6" component="div">
            {paciente.nombre}
          </Typography>
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

        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2" color="text.secondary">
            Email: {paciente.email}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Género: {paciente.genero}
          </Typography>
        </Stack>

        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Divider sx={{ my: 1 }} />
          <Stack spacing={0.7}>
            <Typography variant="body2" color="text.secondary">
              Fecha de nacimiento: {new Date(paciente.fechaNacimiento).toLocaleDateString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Altura: {paciente.altura} cm
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Peso: {paciente.peso} kg
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Nivel de actividad: {paciente.actividad}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              TMB: {paciente.tmb} kcal
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Requerimiento kcal: {paciente.kcal} kcal
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Proteínas: {paciente.pro} g
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Carbohidratos: {paciente.car} g
            </Typography>
          </Stack>
        </Collapse>
      </CardContent>
    </Card>
  );
}
