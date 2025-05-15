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

  const handleOpenForm = () => navigate('/paciente/crear_paciente');
  const handleCloseForm = () => navigate('/pacientes');

  const handlePacienteCreado = (nuevoPaciente) => {
    console.log('Paciente creado:', nuevoPaciente);
    setPacientes((prev) => [...prev, nuevoPaciente]);
    handleCloseForm();
  };

  useEffect(() => {
    const fetchPacientes = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('refreshToken');
        const res = await fetch('http://localhost:8000/pacientes/mis_pacientes', {
          headers: {
            Authorization: `Bearer ${token}`,
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
      <Typography variant="h4">
        Pacientes
      </Typography>
      <CrearPacienteForm
        open={openForm}
        onClose={handleCloseForm}
        onPacienteCreado={handlePacienteCreado}
      />
      <Box sx={{ width: '100%', display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <CrearPacienteCard onClick={handleOpenForm} />

        {loading && <Typography>Cargando pacientes...</Typography>}
        {error && <Typography color="error">{error}</Typography>}

        {!loading &&
          !error &&
          pacientes.map((paciente) => (
            <PacienteCard key={paciente.id} paciente={paciente} />
          ))}
      </Box>


    </Dashboard>
  );
}
