import React, { useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, TextField, DialogActions, MenuItem, Box, Typography } from '@mui/material';
import { BugReport } from '@mui/icons-material';
import { fetchWithAuth } from '../components/api';

const ReportIssueButton = ({ recipeName }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ type: 'Datos incorrectos', description: '' });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await fetchWithAuth('/reports/report_issue', {
        method: 'POST',
        body: JSON.stringify({
          recipe_name: recipeName,
          error_type: form.type,
          description: form.description,
          metadata: { url: window.location.href, userAgent: navigator.userAgent }
        }),
      });
      alert('¡Gracias! Hemos recibido tu reporte.');
      setOpen(false);
      setForm({ type: 'Datos incorrectos', description: '' });
    } catch (err) {
      alert('Error al enviar el reporte.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button 
        variant="outlined" 
        color="error" 
        startIcon={<BugReport />} 
        onClick={() => setOpen(true)}
        sx={{ borderRadius: 2, mt: 2, fontWeight: 'bold' }}
      >
        Reportar fallo
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', pb: 0 }}>
          Reportar fallo
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="caption" color="textSecondary" sx={{ mb: 2, display: 'block' }}>
            En: {recipeName}
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}> 
            <TextField
              select
              fullWidth
              label="Tipo de error"
              variant="standard" // Cambiado a standard para evitar solapamientos de bordes
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              InputLabelProps={{ shrink: true }}
            >
              {['Datos incorrectos', 'Imagen errónea', 'Error de carga', 'Otros'].map(opt => (
                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Descripción del problema"
              variant="standard" // Estilo más limpio que no choca con el texto
              multiline
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Escribe aquí los detalles..."
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpen(false)} sx={{ color: 'text.secondary' }}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleSubmit} 
            disabled={loading || !form.description.trim()}
            sx={{ borderRadius: 2, px: 3 }}
          >
            {loading ? 'Enviando...' : 'Enviar reporte'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ReportIssueButton;