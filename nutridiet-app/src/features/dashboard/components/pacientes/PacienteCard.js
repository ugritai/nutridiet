import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Collapse,
  IconButton,
  Stack,
  Divider,
  Button
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';


export default function PacienteCard({ paciente, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();


  const handleExpandClick = () => setExpanded(!expanded);
  const handleEditClick = () => {
    if (onEdit) {
      onEdit(paciente);
    }
  };

  if (!paciente) return null;

  const genderLabels = {
    male: "Hombre",
    female: "Mujer",
    other: "Otro"
  };

  const genderText = genderLabels[paciente.gender] || paciente.gender;

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
              onClick={() => onDelete?.(paciente)}
              aria-label="eliminar paciente"
              size="small"
            >
              <DeleteIcon />
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
            Dieta actual: {paciente.current_diet?.name || 'No asignada'}
          </Typography>
          {paciente.current_diet && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => navigate(`/detalle_dieta/${encodeURIComponent(paciente.current_diet.name)}`, {
                state: { dietaId: paciente.current_diet.id }
              })}
              sx={{ mt: 1 }}
            >
              Ver dieta
            </Button>
          )}
        </Stack>

        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Divider sx={{ my: 1 }} />
          <Stack spacing={0.7}>
            <Typography variant="body2" color="text.secondary">
              Género: {genderText}
            </Typography>
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
