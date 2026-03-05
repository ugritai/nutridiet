import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Box, Pagination, PaginationItem } from '@mui/material';
import UniversalCard from './UniversalCard';

// --- UTILIDAD DE NORMALIZACIÓN DE NOMBRES ---
const sanitizeFilename = (name) => {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Quitar tildes
    .replace(/[^\w\-]/g, "-")        // Reemplazar especiales por guion
    .replace(/-+/g, "-")             // Colapsar guiones
    .trim("-");                      // Limpiar extremos
};

// --- CONFIGURACIÓN DE MAPEO ROBUSTO ---
export const CATEGORY_MAPPING = {
  Verduras: ["verdura", "vegetal", "hortaliza", "hierba", "especia"],
  Legumbres: ["legumbre", "semilla", "nuez", "frutos secos"],
  Carne: ["carne", "res", "cerdo", "cordero", "ternera", "caza", "embutido", "avicola", "pollo", "pavo"],
  Frutas: ["fruta", "jugo", "zumo", "fruticola"],
  Pescados: ["pescado", "marisco", "molusco", "reptil", "crustaceo"],
  Lácteos: ["leche", "lacteo", "huevo", "ovoproducto", "queso", "yogur"],
  Cereales: ["cereal", "grano", "pasta", "horneado", "pan", "bolleria", "harina", "arroz"],
  Bebidas: ["bebida", "refresco", "alcohol", "cafe", "te", "infusion"],
  Dulces: ["azucar", "chocolate", "dulce", "aperitivo", "snack", "golosina", "caramelo"],
  "Platos Preparados": ["comida", "restaurante", "rapida", "plato", "guarnicion", "sopa", "salsa", "bebe", "infantil", "varios", "indios", "mezcla"],
  Aceites: ["grasa", "aceite", "mantequilla", "margarina"]
};

const CARD_CONTENT = {
  Verduras: { description: "Verduras, hortalizas y hierbas aromáticas." },
  Legumbres: { description: "Legumbres, semillas y frutos secos nutritivos." },
  Carne: { description: "Carnes rojas, blancas y embutidos de calidad." },
  Frutas: { description: "Frutas frescas y jugos naturales." },
  Pescados: { description: "Pescados, mariscos y productos del mar." },
  Lácteos: { description: "Leche, quesos, yogures y huevos." },
  Cereales: { description: "Granos, pastas, arroces y productos de panadería." },
  Bebidas: { description: "Agua, jugos, refrescos e infusiones." },
  Dulces: { description: "Postres, chocolates y snacks dulces." },
  "Platos Preparados": { description: "Comidas listas, sopas, salsas y alimentación infantil." },
  Aceites: { description: "Grasas saludables y aceites vegetales." },
  Otros: { description: "Otros alimentos y categorías misceláneas." }
};
export function mapCategoryToMain(categoria) {
  if (!categoria) return "Otros";
  const cleanCategory = categoria.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  for (const [main, keywords] of Object.entries(CATEGORY_MAPPING)) {
    if (keywords.some(key => cleanCategory.includes(key))) {
      return main;
    }
  }
  return categoria; // Si no hay match, devolvemos la original en lugar de "Otros"
}

export default function FoodGrid({ categories = [], basePath = "alimentos", shouldMap = false }) {
  const itemsPerPage = 9;
  const [searchParams, setSearchParams] = useSearchParams();

  // 1. Procesar categorías
  const processedCategories = Array.from(new Set(
    categories
      .filter(cat => cat !== null && cat !== undefined)
      .map(cat => {
        const name = typeof cat === 'object' ? cat.category_esp : cat;
        // Solo mapeamos si shouldMap es true (para Alimentos)
        return shouldMap ? mapCategoryToMain(name) : name;
      })
  )).filter(c => c !== "Otros");

  const totalPages = Math.ceil(processedCategories.length / itemsPerPage);
  const pageParam = parseInt(searchParams.get('page')) || 1;
  const [page, setPage] = useState(pageParam - 1);

  useEffect(() => {
    setSearchParams({ page: page + 1 });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page, setSearchParams]);

  const currentPageItems = processedCategories.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

  return (
    <Box sx={{ width: '100%', mt: 4 }}>
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, 
        gap: 3 
      }}>
        {currentPageItems.map((category) => (
          <UniversalCard
            key={category}
            title={category}
            description={CARD_CONTENT[category]?.description || `Explora recetas y productos de ${category}.`}
            image={`/img/${basePath}/${sanitizeFilename(category)}.jpg`} // Carpeta dinámica
            buttonLink={`/${basePath}/categorias/${encodeURIComponent(category)}`}
          />
        ))}
      </Box>

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6, mb: 4 }}>
          <Pagination 
            page={page + 1} 
            count={totalPages} 
            onChange={(e, v) => setPage(v - 1)} 
            color="primary"
            renderItem={(item) => (
              <PaginationItem component={Link} to={`?page=${item.page}`} {...item} />
            )}
          />
        </Box>
      )}
    </Box>
  );
}