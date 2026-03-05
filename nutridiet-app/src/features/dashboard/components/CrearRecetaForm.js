import React, { useState, useEffect } from 'react';
import { 
  Box, Button, TextField, Typography, Stack, Autocomplete, 
  IconButton, List, ListItem, Paper, MenuItem 
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { fetchWithAuth } from './api'; 

export default function RecetaForm({ recetaEdit = null, onSuccess }) {
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState('');
  const [minutos, setMinutos] = useState(30);
  const [dificultad, setDificultad] = useState('Media');
  const [comensales, setComensales] = useState(1);
  const [foto, setFoto] = useState(null);
  const [pasos, setPasos] = useState(['']);
  const [detalles, setDetalles] = useState(''); // <-- NUEVO ESTADO PARA DETALLES
  const [ingredientesSeleccionados, setIngredientesSeleccionados] = useState([]);
  const [busquedaAlimentos, setBusquedaAlimentos] = useState([]); 

  const recetaId = recetaEdit?._id || recetaEdit?.id;
  const isEdit = Boolean(recetaEdit && recetaId);

  useEffect(() => {
    if (recetaEdit) {
      setTitulo(recetaEdit.title || recetaEdit.titulo || '');
      setCategoria(recetaEdit.category || recetaEdit.categoria || '');
      setMinutos(recetaEdit.minutes || 30);
      setDificultad(recetaEdit.dificultad || 'Media');
      setComensales(recetaEdit.n_diners || 1);
      setPasos(recetaEdit.steps || recetaEdit.pasos || ['']);
      setDetalles(recetaEdit.detalles || recetaEdit.details || ''); // <-- CARGAMOS DETALLES
      
      const ingredientesOriginales = recetaEdit.ingredients || recetaEdit.ingredientes || [];
      const ingredientesMapeados = ingredientesOriginales.map(ing => ({
        nombre_pantalla: ing.ingredient || ing.nombre_pantalla,
        alimento_id: ing.ingredientID || ing.alimento_id,
        cantidad_g: ing.cantidad_g || 100 
      }));
      setIngredientesSeleccionados(ingredientesMapeados);
    }
  }, [recetaEdit]);

  const handleBuscarAlimento = async (query) => {
    if (query.length < 3) {
        setBusquedaAlimentos([]);
        return;
    }
    try {
        const res = await fetchWithAuth(`/alimentos/buscar_alimentos/${query}`);
        if (res.ok) {
            const data = await res.json();
            setBusquedaAlimentos(Array.isArray(data) ? data : []);
        }
    } catch (error) {
        console.error("Error buscando alimentos:", error);
    }
  };

  const agregarIngrediente = (alimento) => {
    if (!alimento) return;
    setIngredientesSeleccionados([...ingredientesSeleccionados, {
      nombre_pantalla: alimento.nombre,
      alimento_id: alimento._id,
      cantidad_g: 100
    }]);
  };

  const handleGuardar = async () => {
      if (!titulo || !categoria || ingredientesSeleccionados.length === 0) {
          alert("Por favor, rellena los campos obligatorios.");
          return;
      }

      const formData = new FormData();
      const objetoReceta = {
          titulo: titulo.trim(),
          categoria: categoria.trim(),
          minutes: parseInt(minutos) || 0,
          dificultad: dificultad,
          n_diners: parseInt(comensales) || 1,
          pasos: pasos.filter(p => p.trim() !== ""),
          detalles: detalles.trim(), // <-- ENVIAMOS DETALLES AL BACKEND
          ingredientes: ingredientesSeleccionados.map(ing => ({
              nombre_pantalla: ing.nombre_pantalla || ing.ingredient, 
              alimento_id: ing.alimento_id || ing.ingredientID,       
              cantidad_g: parseFloat(ing.cantidad_g) || 100          
          }))
      };

      formData.append('datos_receta', JSON.stringify(objetoReceta));
      if (foto) formData.append('foto', foto);

      const url = isEdit 
          ? `/recetas/actualizar_receta/${recetaId}` 
          : `/recetas/crear_receta_profesional`;
  
      const method = isEdit ? 'PUT' : 'POST';

      try {
          const response = await fetchWithAuth(url, {
              method: method,
              body: formData, 
          });

          if (response.ok) {
              alert(isEdit ? '¡Receta actualizada!' : '¡Receta creada!');
              if (!isEdit) {
                  setTitulo(''); setCategoria(''); setPasos(['']); setDetalles(''); setIngredientesSeleccionados([]);
              }
              // 🔥 AÑADE ESTA LÍNEA PARA AVISAR A LA PÁGINA PADRE:
              if (onSuccess) onSuccess(titulo.trim());
          } else {
              const errorData = await response.json();
              console.error("Detalle del error 422:", errorData);
              alert(`Error: ${JSON.stringify(errorData.detail || 'Error al procesar')}`);
          }
      } catch (error) {
          alert('Error de conexión.');
      }
    };

  const inputProps = { fullWidth: true, InputLabelProps: { shrink: true } };

  return (
    <Box sx={{ p: 2, width: '100%' }}>
      <Typography variant="h4" gutterBottom color={isEdit ? "primary" : "green"} sx={{ fontWeight: 'bold' }}>
        {isEdit ? 'Editar Receta' : 'Crear Nueva Receta'}
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack spacing={3}>
          <TextField 
            {...inputProps}
            label="Título de la receta" 
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)} 
          />

          <TextField
            {...inputProps}
            select
            label="Categoría"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            {CATEGORIAS_RECETAS.map((option) => (
              <MenuItem key={option.label} value={option.label.toLowerCase()}>
                <Box>
                    <Typography variant="body1">{option.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{option.desc}</Typography>
                </Box>
              </MenuItem>
            ))}
          </TextField>

          <Stack direction="row" spacing={2}>
            <TextField 
                {...inputProps}
                label="Tiempo (minutos)" 
                type="number" 
                value={minutos} 
                onChange={(e) => setMinutos(e.target.value)} 
            />
            <TextField 
                {...inputProps}
                select
                label="Dificultad" 
                value={dificultad} 
                onChange={(e) => setDificultad(e.target.value)}
            >
                <MenuItem value="Fácil">Fácil</MenuItem>
                <MenuItem value="Media">Media</MenuItem>
                <MenuItem value="Difícil">Difícil</MenuItem>
            </TextField>
          </Stack>

          <TextField 
            {...inputProps}
            label="Número de raciones" 
            type="number" 
            value={comensales} 
            onChange={(e) => setComensales(e.target.value)} 
          />
          
          <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />} sx={{ py: 1.5 }}>
            {foto ? `Nueva Imagen: ${foto.name}` : isEdit ? "Cambiar Foto (Opcional)" : "Subir Foto de la Receta"}
            <input type="file" hidden onChange={(e) => setFoto(e.target.files[0])} />
          </Button>
        </Stack>
      </Paper>

      {/* SECCIÓN INGREDIENTES */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Ingredientes</Typography>
        <Autocomplete
          options={busquedaAlimentos}
          getOptionLabel={(opt) => opt.nombre || ""}
          onInputChange={(e, val) => handleBuscarAlimento(val)}
          onChange={(e, val) => agregarIngrediente(val)}
          renderInput={(params) => <TextField {...params} {...inputProps} label="Buscar en FoodDB..." />}
          noOptionsText="Escribe al menos 3 letras"
        />
        <List>
            {ingredientesSeleccionados.map((ing, index) => (
                <ListItem key={index} divider secondaryAction={
                    <IconButton edge="end" onClick={() => setIngredientesSeleccionados(prev => prev.filter((_, i) => i !== index))}>
                        <DeleteIcon />
                    </IconButton>
                }>
                    <Typography sx={{ flexGrow: 1 }}>{ing.nombre_pantalla}</Typography>
                    <TextField 
                        size="small" label="Gramos" type="number" 
                        value={ing.cantidad_g} 
                        sx={{ width: 100, ml: 2 }}
                        InputLabelProps={{ shrink: true }}
                        onChange={(e) => {
                            const newIngs = [...ingredientesSeleccionados];
                            newIngs[index].cantidad_g = e.target.value;
                            setIngredientesSeleccionados(newIngs);
                        }}
                    />
                </ListItem>
            ))}
        </List>
      </Paper>

      {/* SECCIÓN PREPARACIÓN */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Preparación</Typography>
        {pasos.map((paso, index) => (
            <TextField 
                {...inputProps}
                key={index} multiline label={`Paso ${index + 1}`} sx={{ mb: 2 }} value={paso}
                onChange={(e) => {
                    const newPasos = [...pasos];
                    newPasos[index] = e.target.value;
                    setPasos(newPasos);
                }}
            />
        ))}
        <Button variant="text" onClick={() => setPasos([...pasos, ""])}>+ Añadir Paso</Button>
      </Paper>

      {/* NUEVA SECCIÓN: DETALLES / NOTAS */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Detalles Adicionales / Notas</Typography>
        <TextField 
            {...inputProps}
            multiline 
            minRows={3}
            placeholder="Añade notas, consejos, alérgenos o variaciones para esta receta..."
            value={detalles}
            onChange={(e) => setDetalles(e.target.value)}
        />
      </Paper>

      <Button variant="contained" color={isEdit ? "primary" : "success"} size="large" fullWidth onClick={handleGuardar} sx={{ mt: 2, py: 2, fontWeight: 'bold' }}>
        {isEdit ? 'Guardar Cambios' : 'Publicar Receta'}
      </Button>
    </Box>
  );
}

const CATEGORIAS_RECETAS = [
    { label: 'Sopas', desc: 'Explora recetas y productos de Sopas.' },
    { label: 'Ensaladas', desc: 'Explora recetas y productos de Ensaladas.' },
    { label: 'Arroz', desc: 'Explora recetas y productos de Arroz.' },
    { label: 'Pasta', desc: 'Explora recetas y productos de Pasta.' },
    { label: 'Guisos', desc: 'Explora recetas y productos de Guisos.' },
    { label: 'Pescado', desc: 'Explora recetas y productos de Pescado.' },
    { label: 'Carne', desc: 'Carnes rojas, blancas y embutidos de calidad.' },
    { label: 'Fruta', desc: 'Explora recetas y productos de Fruta.' },
    { label: 'Postres', desc: 'Dulces y repostería.' }
];