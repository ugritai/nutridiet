import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Dashboard from '../Dashboard';
import CrearPacienteCard from '../components/pacientes/CrearPacienteCard';
import CrearPacienteForm from '../components/pacientes/CrearPacienteForm';
import PacienteCard from '../components/pacientes/PacienteCard';

import { Box, Typography } from '@mui/material';

export default function PacientesPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const openForm = location.pathname === '/paciente/crear_paciente';

  // Paciente para editar, null si se crea nuevo
  const [pacienteEditar, setPacienteEditar] = useState(null);

  const handleOpenForm = () => {
    setPacienteEditar(null); // limpia antes de abrir
    navigate('/paciente/crear_paciente');
  };

  const handleCloseForm = () => {
    setPacienteEditar(null); // limpia al cerrar
    navigate('/pacientes');
  };

  // Cuando se crea o edita un paciente
  const handlePacienteCreado = (paciente) => {
    if (pacienteEditar) {
      // Editamos: actualizar en la lista
      setPacientes((prev) =>
        prev.map((p) => (p.id === paciente.id ? paciente : p))
      );
    } else {
      // Creamos: agregar al final
      setPacientes((prev) => [...prev, paciente]);
    }
    handleCloseForm();
  };

  const handleEditPaciente = (paciente) => {
    setPacienteEditar(paciente);
    navigate('/paciente/crear_paciente');
  };

  useEffect(() => {
    const fetchPacientes = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem('accessToken') || localStorage.getItem('refreshToken');

        if (!token) throw new Error('No token disponible');

        const res = await fetch('http://localhost:8000/pacientes/mis_pacientes/', {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
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
          pacientes.map((paciente) => (
            <PacienteCard
              key={paciente.id}
              paciente={paciente}
              onEdit={handleEditPaciente}
            />
          ))}
      </Box>
    </Dashboard>
  );
}
