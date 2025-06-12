import React from "react";
import { Box, Typography, Divider } from "@mui/material";
import Dashboard from "./Dashboard";
import Copyright from "./components/Copyright";

export default function AcercaDe() {
    return (
        <Dashboard>
            <Box sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Acerca del Sistema
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Typography variant="body1" paragraph>
                    Este sistema ha sido desarrollado para ayudar a nutricionistas en la planificación y seguimiento de dietas personalizadas para pacientes.
                </Typography>

                <Typography variant="body1" paragraph>
                    Incluye funcionalidades como gestión de pacientes, creación de ingestas diarias, recetas con valores nutricionales, y generación automática de dietas.
                </Typography>

                <Typography variant="body1" paragraph>
                    El sistema ha sido construido utilizando tecnologías modernas como React, FastAPI y MongoDB, garantizando un rendimiento ágil y una experiencia de usuario fluida.
                </Typography>

                <Typography variant="caption" display="block" sx={{ mt: 4, color: "text.secondary" }}>
                    Versión 1.0 - Proyecto TFG, Universidad Granada
                </Typography>
            </Box>

            <Copyright sx={{ my: 4 }} />

        </Dashboard>
    );
}
