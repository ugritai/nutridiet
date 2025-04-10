import * as React from 'react';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

export default function Search() {
  const handleSearch = () => {
    // Lógica de búsqueda
    console.log('Buscando...');
  };

  return (
    <Stack direction="row" spacing={2} sx={{ width: '90%' }}>
      <FormControl sx={{ flexGrow: 1 }} variant="outlined">
      <OutlinedInput
        size="small"
        id="search"
        placeholder="Buscar recetas..."
        sx={{ width: '100%' }} 
        startAdornment={
          <InputAdornment position="start" sx={{ color: 'text.primary' }}>
            <SearchRoundedIcon fontSize="small" />
          </InputAdornment>
        }
        inputProps={{
          'aria-label': 'search',
        }}
      />
    </FormControl>
    <Button
    variant="contained"
    color="primary"
    onClick={handleSearch}
    sx={{ height: '100%' }}
  >
    Buscar
  </Button>
  </Stack>
  );
}

