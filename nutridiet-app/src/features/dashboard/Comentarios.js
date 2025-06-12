import React from "react";
import { Box, Typography, Divider } from "@mui/material";
import Dashboard from "./Dashboard";

export default function Comentarios() {
  return (
    <Dashboard>
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Comentarios y Sugerencias
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Typography variant="body1" paragraph>
          Si tienes sugerencias, errores detectados o ideas para mejorar el sistema, no dudes en compartir tus comentarios.
        </Typography>

        <Typography variant="body1" paragraph>
          Tu retroalimentación es muy valiosa y nos ayuda a seguir mejorando la experiencia para todos los usuarios.
        </Typography>

        <Typography variant="caption" display="block" sx={{ mt: 4, color: "text.secondary" }}>
          Puedes enviar tus comentarios al correo: zhulinqi@correo.ugr.es
        </Typography>
      </Box>
    </Dashboard>
  );
}
