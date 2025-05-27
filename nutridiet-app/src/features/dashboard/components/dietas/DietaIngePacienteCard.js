import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard from '../../Dashboard';
import CrearDietaCard from './CrearDietaCard';
import CrearIngestaCard from './CrearIngestaCard';
import { useParams } from 'react-router-dom';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import {
    Accordion,
    AccordionSummary,
    AccordionDetails,
    IconButton,
    Card,
    Typography,
    Box
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import dayjs from 'dayjs';



dayjs.extend(isSameOrBefore);


export default function DietaIngePacienteCard() {
    const navigate = useNavigate();
    const { pacienteN } = useParams();

    const [dietasExistentes, setDietasExistentes] = useState([]);

    useEffect(() => {
        const fetchDietas = async () => {
            try {
                const res = await fetch(`http://localhost:8000/planificacion_dietas/dietas_paciente/${pacienteN}`);
                if (!res.ok) throw new Error('No se pudieron obtener las dietas existentes');
                const data = await res.json();
                setDietasExistentes(data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchDietas();
    }, [pacienteN]);

    const [ingestasExistentes, setIngestasExistentes] = useState([]);

    useEffect(() => {
        const fetchIngestas = async () => {
            try {
                const res = await fetch(`http://localhost:8000/planificacion_ingestas/ingestas/${pacienteN}`);
                if (!res.ok) throw new Error('No se pudieron obtener las dietas existentes');
                const data = await res.json();
                setIngestasExistentes(data);
                console.log(data)
            } catch (err) {
                console.error(err);
            }
        };
        fetchIngestas();
    }, [pacienteN]);


    const handleEditarDieta = (dieta) => {
        navigate(`/planificacion_dieta/${pacienteN}/editar_dieta/${dieta.id}`); // ajusta según tu ruta
      };
      
      const handleEliminarDieta = async (dieta) => {
        if (window.confirm('¿Estás seguro de eliminar esta dieta?')) {
          // llamada al backend para eliminar
        }
      };
      
      const handleEditarIngesta = (ingesta) => {
        navigate(`/planificacion_dieta/${pacienteN}/editar_ingesta/${ingesta.id}`); // ajusta según tu ruta
      };
      
      const handleEliminarIngesta = async (ingesta) => {
        if (window.confirm('¿Estás seguro de eliminar esta ingesta?')) {
          // llamada al backend para eliminar
        }
      };      

    return (
        <Dashboard>

            <Typography variant="h4">
                {pacienteN}
            </Typography>
            <Box sx={{ width: '100%', display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                <CrearDietaCard onClick={() => navigate(`/planificacion_dieta/${pacienteN}/crear_dieta`)} />
                <CrearIngestaCard onClick={() => navigate(`/planificacion_dieta/${pacienteN}/crear_ingesta`)} />
            </Box>

            {ingestasExistentes.length > 0 && (
                <Box sx={{ mt: 4, width: '100%' }}>
                    <Typography variant="h6">Ingestas del paciente</Typography>

                    {ingestasExistentes.map((ingesta, idx) => (
                        <Accordion key={idx} sx={{ mt: 2 }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography sx={{ flexGrow: 1 }}>
                                    {ingesta.intake_type}
                                </Typography>
                                <IconButton size="small" onClick={() => handleEditarIngesta(ingesta)}>
                                    <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton size="small" onClick={() => handleEliminarIngesta(ingesta)}>
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </AccordionSummary>

                            <AccordionDetails>
                                {Object.entries(ingesta.recipes).map(([tipo, recetasArray]) =>
                                    recetasArray.length > 0 ? (
                                        <Box key={tipo} sx={{ ml: 2, mt: 1 }}>
                                            <Typography variant="body2" fontWeight="bold" sx={{ textTransform: 'capitalize' }}>
                                                {tipo}:
                                            </Typography>
                                            {recetasArray.map((rec, i) => (
                                                <Typography key={i} variant="body2" sx={{ ml: 1 }}>
                                                    - {rec.name}
                                                </Typography>
                                            ))}
                                        </Box>
                                    ) : null
                                )}
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Box>
            )}

            {dietasExistentes.length > 0 && (
                <Box sx={{ mt: 4, width: '100%' }}>
                    <Typography variant="h6">Dietas del paciente</Typography>

                    {dietasExistentes.map((dieta, idx) => (
                        <Accordion key={idx} sx={{ mt: 2 }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography sx={{ flexGrow: 1 }}>
                                    {dieta.nombre_dieta} ({dayjs(dieta.fecha_inicio).format('DD/MM/YYYY')} - {dayjs(dieta.fecha_final).format('DD/MM/YYYY')})
                                </Typography>
                                <IconButton size="small" onClick={() => handleEditarDieta(dieta)}>
                                    <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton size="small" onClick={() => handleEliminarDieta(dieta)}>
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </AccordionSummary>

                            <AccordionDetails>
                                {/* Aquí puedes mostrar más detalles si lo deseas */}
                                <Typography variant="body2">Detalles adicionales aquí si los hay...</Typography>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Box>
            )}

        </Dashboard>
    );
}
