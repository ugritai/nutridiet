import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Divider,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
} from "@mui/material";
import Dashboard from "./Dashboard";
import ColorModeSelect from "../../assets/shared-theme/ColorModeSelect";

const opcionesTarjetas = [
  "alimentos",
  "recetas",
  "pacientes",
  "dietas",
];

const etiquetas = {
  alimentos: "Alimentos",
  recetas: "Recetas",
  pacientes: "Pacientes",
  dietas: "Planificación de dietas",
};

export default function Configuracion() {
  const [ordenTarjetas, setOrdenTarjetas] = useState(opcionesTarjetas);

  useEffect(() => {
    const savedOrden = JSON.parse(localStorage.getItem("ordenTarjetas")) || opcionesTarjetas;
    setOrdenTarjetas(savedOrden);
  }, []);

  const handleGuardar = () => {
    localStorage.setItem("ordenTarjetas", JSON.stringify(ordenTarjetas));
    alert("Configuración guardada.");
  };

  return (
    <Dashboard>
      <Box sx={{ p: 4, maxWidth: 600 }}>
        <Typography variant="h4" gutterBottom>
          Configuración
        </Typography>

        <Divider sx={{ my: 3 }} />

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Modo de color</InputLabel>
          <ColorModeSelect fullWidth />
        </FormControl>

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Orden de tarjetas</InputLabel>
          <Select
            multiple
            value={ordenTarjetas}
            onChange={(e) => setOrdenTarjetas(e.target.value)}
            renderValue={(selected) => selected.map((s) => etiquetas[s]).join(", ")}
          >
            {opcionesTarjetas.map((op) => (
              <MenuItem key={op} value={op}>
                <Checkbox checked={ordenTarjetas.indexOf(op) > -1} />
                <ListItemText primary={etiquetas[op]} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button variant="contained" onClick={handleGuardar}>
          Guardar cambios
        </Button>
      </Box>
    </Dashboard>
  );
}
