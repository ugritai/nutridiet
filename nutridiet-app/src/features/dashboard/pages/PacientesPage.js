import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Dashboard from '../Dashboard';
import CrearPacienteCard from '../components/pacientes/CrearPacienteCard';
import CrearPacienteForm from '../components/pacientes/CrearPacienteForm';
import PacienteCard from '../components/pacientes/PacienteCard';
import { fetchWithAuth } from '../components/api';
import { Box, Typography, Button, Stack } from '@mui/material';

const PACIENTES_POR_PAGINA = 5;

export default function PacientesPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [pagina, setPagina] = useState(1);

  const totalPaginas = Math.ceil(pacientes.length / PACIENTES_POR_PAGINA);

  const pacientesVisibles = pacientes.slice(
    (pagina - 1) * PACIENTES_POR_PAGINA,
    pagina * PACIENTES_POR_PAGINA
  );

  const openForm = location.pathname === '/paciente/crear_paciente';
  const [pacienteEditar, setPacienteEditar] = useState(null);

  const handleOpenForm = () => {
    setPacienteEditar(null);
    navigate('/paciente/crear_paciente');
  };

  const handleCloseForm = () => {
    setPacienteEditar(null);
    navigate('/pacientes');
  };

  const handlePacienteCreado = (paciente) => {
    if (pacienteEditar) {
      setPacientes((prev) =>
        prev.map((p) => (p.id === paciente.id ? paciente : p))
      );
    } else {
      setPacientes((prev) => [...prev, paciente]);
    }
    handleCloseForm();
  };

  const handleEditPaciente = (paciente) => {
    setPacienteEditar(paciente);
    navigate('/paciente/crear_paciente');
  };

  const handleDeletePaciente = async (paciente) => {
    const confirmar = window.confirm(`¿Seguro que deseas eliminar a ${paciente.name}?`);
    if (!confirmar) return;
  
    try {
      const res = await fetchWithAuth(`/pacientes/delete/${paciente.id}`, {
        method: 'DELETE',
      });
  
      if (!res.ok) {
        const error = await res.json();
        alert(error.detail || 'Error al eliminar el paciente');
        return;
      }
  
      setPacientes((prev) => prev.filter((p) => p.id !== paciente.id));
      alert('Paciente eliminado correctamente');
    } catch (err) {
      console.error('Error al eliminar paciente:', err);
      alert('No se pudo conectar al servidor');
    }
  };
  

  useEffect(() => {
    const fetchPacientes = async () => {
      try {
        setLoading(true);
        const res = await fetchWithAuth('/pacientes/mis_pacientes', {
          method: 'GET',
        });

        if (!res.ok) throw new Error('Error al cargar pacientes');
        const data = await res.json();
        setPacientes(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPacientes();
  }, []);

  const handleSiguiente = () => {
    if (pagina < totalPaginas) setPagina((prev) => prev + 1);
  };

  const handleAnterior = () => {
    if (pagina > 1) setPagina((prev) => prev - 1);
  };

  return (
    <Dashboard>
      <Typography variant="h4" mb={2}>
        Pacientes
      </Typography>

      <CrearPacienteForm
        open={openForm}
        onClose={handleCloseForm}
        onPacienteCreado={handlePacienteCreado}
        pacienteInicial={pacienteEditar}
      />

      <Box sx={{ width: '100%', display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <CrearPacienteCard onClick={handleOpenForm} />

        {loading && <Typography>Cargando pacientes...</Typography>}
        {error && <Typography color="error">{error}</Typography>}

        {!loading &&
          !error &&
          pacientesVisibles.map((paciente) => (
            <PacienteCard
              key={paciente.id}
              paciente={paciente}
              onEdit={handleEditPaciente}
              onDelete={handleDeletePaciente}  
            />
          ))}
      </Box>

      {!loading && !error && pacientes.length > 0 && (
        <Stack direction="row" spacing={2} mt={4} alignItems="center">
          <Button onClick={handleAnterior} disabled={pagina === 1}>
            Anterior
          </Button>
          <Typography>
            Página {pagina} de {totalPaginas}
          </Typography>
          <Button onClick={handleSiguiente} disabled={pagina === totalPaginas}>
            Siguiente
          </Button>
        </Stack>
      )}
    </Dashboard>
  );
}
