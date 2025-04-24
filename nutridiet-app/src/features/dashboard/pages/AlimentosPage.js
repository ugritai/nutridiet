import React, { useEffect, useState } from 'react';
import Dashboard from '../Dashboard';
import FoodGrid from '../components/FoodGrid';
import Search from '../components/Search';
import { CircularProgress, List, ListItem, ListItemText, Typography } from '@mui/material';

export default function AlimentosPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/ingredient_categories')
      .then(res => res.json())
      .then(data => {
        console.log('Data received:', data);  // 输出返回的数据
        setCategories(data.categories);
      })
      .catch(err => {
        console.error("Error al obtener categorías:", err)
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const handleSearch = async (value) => {
    // 处理搜索逻辑
  };

  const handleSuggestions = async (value) => {
    if (!value) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/sugerir_alimentos/${value}`);
      if (!response.ok) throw new Error("No encontrado");
      const data = await response.json();

      const sugerencias = data.map(item => item.nombre);
      setSuggestions(sugerencias);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
      setSuggestions([]);
    }
  };


  return (
    <Dashboard>
      <Search
        value={query}
        onChange={(value) => {
          setQuery(value);
          handleSuggestions(value);
        }}
        onSubmit={handleSearch}
        suggestions={suggestions}
        placeholder="Buscar alimentos..."
      />

      <Typography variant="h4" gutterBottom>
        Categorías de Alimentos
      </Typography>

      {loading ? (
        <CircularProgress />
      ) : (
        <>
          {categories.length === 0 ? (
            <Typography variant="h6" color="error">No se encontraron categorías.</Typography>
          ) : (
            <>
              <FoodGrid categories={categories} />

            </>
          )}
        </>
      )}
    </Dashboard>
  );
}
