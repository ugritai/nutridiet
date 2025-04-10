import * as React from 'react';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import ListItemText from '@mui/material/ListItemText';
import Select from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress'; 

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

export default function CategorySelect({ onCategoryChange }) {
    const [categories, setCategories] = React.useState([]);  // Estado para las categorías
    const [selectedCategories, setSelectedCategories] = React.useState([]);  // Estado para las categorías seleccionadas
    const [loading, setLoading] = React.useState(true);  // Estado para mostrar el indicador de carga
  
    // Realizar la petición para obtener las categorías
    React.useEffect(() => {
      const fetchCategories = async () => {
        try {
          const response = await fetch('http://localhost:8000/categories'); // Asegúrate de que la URL esté correcta
          if (response.ok) {
            const data = await response.json();
            setCategories(data.categories || []);  // Si la respuesta es correcta, guardar las categorías
          } else {
            console.error('Error al obtener las categorías');
            setCategories([]);  // Si hay un error, establecer un array vacío
          }
        } catch (error) {
          console.error("Error al obtener las categorías:", error);
          setCategories([]);  // Si ocurre un error en la solicitud, también establecer un array vacío
        } finally {
          setLoading(false);  // Finaliza el estado de carga
        }
      };
  
      fetchCategories();
    }, []);
  
    const handleChange = (event) => {
      const {
        target: { value },
      } = event;
      setSelectedCategories(
        // Cuando autofill ocurre, se obtiene un valor string, por lo tanto lo dividimos
        typeof value === 'string' ? value.split(',') : value,
      );
  
      // Llamar a la función de callback para pasar la categoría seleccionada
      if (onCategoryChange) {
        onCategoryChange(value);
      }
    };
  
    // Si aún estamos cargando los datos, mostrar el indicador de carga
    if (loading) {
      return <CircularProgress />;  // Indicador de carga mientras obtenemos las categorías
    }
  
    return (
      <div>
        <FormControl sx={{ m: 1, width: 300 }}>
          <InputLabel id="demo-multiple-checkbox-label">Categorías</InputLabel>
          <Select
            labelId="demo-multiple-checkbox-label"
            id="demo-multiple-checkbox"
            multiple
            value={selectedCategories}
            onChange={handleChange}
            input={<OutlinedInput label="Categorías" />}
            renderValue={(selected) => selected.join(', ')}  // Muestra las categorías seleccionadas
            MenuProps={MenuProps}
          >
            {categories.length > 0 ? (
              categories.map((category) => (
                <MenuItem key={category} value={category}>
                  <Checkbox checked={selectedCategories.includes(category)} />
                  <ListItemText primary={category} />
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>No hay categorías disponibles</MenuItem>  // Mensaje si no hay categorías
            )}
          </Select>
        </FormControl>
      </div>
    );
  }
