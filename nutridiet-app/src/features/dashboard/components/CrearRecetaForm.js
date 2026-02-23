import React, { useState } from 'react';
import { 
  Box, Button, TextField, Typography, Stack, Autocomplete, 
  IconButton, List, ListItem, Paper, MenuItem 
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { fetchWithAuth } from './api'; 

// Definición de las categorías con descripción
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

export default function CrearRecetaForm() {
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState('');
  const [minutos, setMinutos] = useState(30);
  const [dificultad, setDificultad] = useState('Media');
  const [comensales, setComensales] = useState(1);
  const [foto, setFoto] = useState(null);
  const [pasos, setPasos] = useState(['']);
  const [ingredientesSeleccionados, setIngredientesSeleccionados] = useState([]);
  const [busquedaAlimentos, setBusquedaAlimentos] = useState([]); 

  const handleBuscarAlimento = async (query) => {
    if (query.length < 3) {
        setBusquedaAlimentos([]);
        return;
    }
    try {
        // Asegúrate de que esta ruta coincida con ingredients.py (/alimentos)
        const res = await fetchWithAuth(`/alimentos/buscar_alimentos/${query}`);
        if (res.ok) {
            const data = await res.json();
            setBusquedaAlimentos(Array.isArray(data) ? data : []);
        } else {
            setBusquedaAlimentos([]);
        }
    } catch (error) {
        console.error("Error buscando alimentos:", error);
        setBusquedaAlimentos([]);
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
        // Validaciones básicas
        if (!titulo || !categoria || ingredientesSeleccionados.length === 0) {
            alert("Por favor, rellena los campos obligatorios.");
            return;
        }

        const formData = new FormData();

        // Creamos el objeto exactamente como lo espera el esquema RecetaProfesionalCreate
        const objetoReceta = {
            titulo: titulo,
            categoria: categoria,
            minutes: parseInt(minutos),    
            dificultad: dificultad,
            n_diners: parseInt(comensales),          
            pasos: pasos.filter(p => p.trim() !== ""),
            ingredientes: ingredientesSeleccionados.map(ing => ({
                nombre_pantalla: ing.nombre_pantalla,
                alimento_id: ing.alimento_id,
                cantidad_g: parseFloat(ing.cantidad_g)
            }))
        };

        // Enviamos TODO el objeto como un string en el campo 'datos_receta'
        formData.append('datos_receta', JSON.stringify(objetoReceta));
    
        // La foto va aparte como archivo
        if (foto) formData.append('foto', foto);

        try {
            const response = await fetchWithAuth(`/recetas/crear_receta_profesional`, {
                method: 'POST',
                body: formData, // No poner headers de Content-Type, el navegador lo hace solo con FormData
            });

            if (response.ok) {
                alert('¡Receta creada con éxito!');
                // Resetear estados...
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.detail || 'Revisa los datos'}`);
            }
        } catch (error) {
            console.error("Error de conexión:", error);
            alert('Error de conexión con el servidor.');
        }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 800, margin: 'auto' }}>
      <Typography variant="h4" gutterBottom color="green" sx={{ fontWeight: 'bold' }}>
        Crear Nueva Receta
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack spacing={3}>
          <TextField 
            label="Título de la receta" 
            fullWidth 
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)} 
          />

          <TextField
            select
            label="Categoría"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            fullWidth
            helperText="Selecciona el tipo de plato"
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
                label="Tiempo (minutos)" 
                type="number" 
                fullWidth 
                value={minutos} 
                onChange={(e) => setMinutos(e.target.value)} 
            />
            <TextField 
                select
                label="Dificultad" 
                fullWidth 
                value={dificultad} 
                onChange={(e) => setDificultad(e.target.value)}
            >
                <MenuItem value="Fácil">Fácil</MenuItem>
                <MenuItem value="Media">Media</MenuItem>
                <MenuItem value="Difícil">Difícil</MenuItem>
            </TextField>
        </Stack>

          <TextField 
            label="Número de raciones" 
            type="number" 
            fullWidth 
            value={comensales} 
            onChange={(e) => setComensales(e.target.value)} 
          />
          
          <Button component="label" variant="outlined" startIcon={<CloudUploadIcon />}>
            {foto ? `Imagen: ${foto.name}` : "Subir Foto"}
            <input type="file" hidden onChange={(e) => setFoto(e.target.files[0])} />
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Ingredientes</Typography>
        <Autocomplete
          options={busquedaAlimentos}
          getOptionLabel={(opt) => opt.nombre || ""}
          onInputChange={(e, val) => handleBuscarAlimento(val)}
          onChange={(e, val) => agregarIngrediente(val)}
          renderInput={(params) => <TextField {...params} label="Buscar en FoodDB..." placeholder="Ej: Pollo, Arroz..." />}
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
                        size="small" label="Gramos" type="number" defaultValue={100} sx={{ width: 100, ml: 2 }}
                        onChange={(e) => {
                            const newIngs = [...ingredientesSeleccionados];
                            newIngs[index].cantidad_g = parseFloat(e.target.value);
                            setIngredientesSeleccionados(newIngs);
                        }}
                    />
                </ListItem>
            ))}
        </List>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6">Preparación</Typography>
        {pasos.map((paso, index) => (
            <TextField 
                key={index} fullWidth multiline label={`Paso ${index + 1}`} sx={{ mb: 2 }} value={paso}
                onChange={(e) => {
                    const newPasos = [...pasos];
                    newPasos[index] = e.target.value;
                    setPasos(newPasos);
                }}
            />
        ))}
        <Button onClick={() => setPasos([...pasos, ""])}>+ Añadir Paso</Button>
      </Paper>

      <Button variant="contained" color="success" size="large" fullWidth onClick={handleGuardar}>
        Publicar Receta
      </Button>
    </Box>
  );
}