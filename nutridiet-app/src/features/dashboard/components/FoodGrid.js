import React, { useState, useEffect } from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import UniversalCard from './UniversalCard';
import Pagination from '@mui/material/Pagination';
import PaginationItem from '@mui/material/PaginationItem';
import { useSearchParams, Link } from 'react-router-dom';

export const CATEGORY_MAPPING = {
  Verduras: [
    "Verduras", "Verduras y Productos Vegetales", "Verduras y productos vegetales"
  ],
  Legumbres: [
    "Legumbres y productos de legumbres", "Legumbres, semillas, frutos secos y productos"
  ],
  Carne: [
    "Carne y productos cárnicos", "Productos de carne de res", "Productos de cerdo",
    "Productos de cordero, ternera y caza", "Embutidos y Embutidos", "Productos avícolas"
  ],
  Frutas: [
    "Frutas y Jugos de Frutas", "Frutas y productos frutícolas", "frutas"
  ],
  Pescados: [
    "Pescado y productos pesqueros", "Pescados, moluscos, reptiles, crustáceos y productos",
    "Productos de pescado y marisco"
  ],
  Lácteos: [
    "Leche y productos lácteos", "Productos lácteos y huevos"
  ],
  Cereales: [
    "Cereales de desayuno", "Cereales y productos a base de cereales",
    "Granos de cereales y pastas", "Granos y productos de cereales"
  ],
  Bebidas: [
    "Bebidas", "Bebidas (no lácteas)", "Bebidas alcohólicas"
  ],
  Dulces: [
    "Azúcar, chocolate y productos afines", "Azúcares, conservas y snacks",
    "Dulces", "Aperitivos"
  ],
};

const CARD_CONTENT = {
  Verduras: {
    description: "Verduras y productos vegetales.",
    image: "/img/alimentos/verduras.jpg"
  },
  Legumbres: {
    description: "Legumbres, semillas, frutos secos y productos.",
    image: "/img/alimentos/legumbres.jpg"
  },
  Carne: {
    description: "Carne y productos cárnicos.",
    image: "/img/alimentos/carnes.jpg"
  },
  Frutas: {
    description: "Frutas y productos frutícolas.",
    image: "/img/alimentos/frutas.webp"
  },
  Pescados: {
    description: "Pescados y productos marinos.",
    image: "/img/alimentos/pescados.jpg"
  },
  Lácteos: {
    description: "Leche y productos lácteos.",
    image: "/img/alimentos/lacteos.jpg"
  },
  Cereales: {
    description: "Granos y productos de cereales.",
    image: "/img/alimentos/cereales.jpg"
  },
  Bebidas: {
    description: "Incluye agua, jugos, refrescos y más.",
    image: "/img/alimentos/bebidas.jpg"
  },
  Dulces: {
    description: "Azúcar, chocolate y productos afines.",
    image: "/img/alimentos/dulces.jpg"
  },
};

export function mapCategoryToMain(categoria) {
  for (const [main, aliases] of Object.entries(CATEGORY_MAPPING)) {
    if (aliases.some(alias => categoria.toLowerCase().includes(alias.toLowerCase()))) {
      return main;
    }
    return categoria;
  }
}
export default function FoodGrid({ categories = [] }) {
  const itemsPerPage = 9;
  const totalPages = Math.ceil(categories.length / itemsPerPage);

  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = parseInt(searchParams.get('page')) || 1;
  const [page, setPage] = useState(pageParam - 1);

  useEffect(() => {
    setSearchParams({ page: page + 1 });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page, setSearchParams]);

  const currentPageItems = categories.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

  const handlePageChange = (event, value) => {
    setPage(value - 1);
  };

  const getImageForCategory = (category) => {
    const formattedCategory = category
        .toLowerCase() // 转为小写
        .normalize("NFD") // 分解重音符
        .replace(/[\u0300-\u036f]/g, "") // 去除重音符
        .replace(/[^\w\s-]/g, '') // 去除其他特殊字符（如括号等）
        .replace(/\s+/g, '-') // 替换空格为连字符
        .replace(/-+/g, '-'); // 替换多个连字符为一个

    const imagePath = `/img/alimentos/${formattedCategory}.jpg`; // 生成图片路径
    console.log(`Category: ${category}, Image Path: ${imagePath}`); // 打印分类和图片路径
    return imagePath; // 返回对应的图片路径
  };

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' }, mt: 4 }}>
      <Grid container spacing={2} columns={12} sx={{ mb: (theme) => theme.spacing(2) }}>
        {currentPageItems.map((category, index) => (
          <Grid size={{ xs: 12, sm: 6, lg: 4, md: 4 }} key={category}>
            <UniversalCard
              title={category} // 直接使用分类名
              image={getImageForCategory(category)} // 获取分类对应的图片
              buttonLink={`/alimentos/categorias/${encodeURIComponent(category)}`}
            />
          </Grid>
        ))}
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Pagination
          page={page + 1}
          count={totalPages}
          onChange={handlePageChange}
          renderItem={(item) => (
            <PaginationItem
              component={Link}
              to={`?page=${item.page}`}
              {...item}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: '#f5f5f5',
                  color: 'primary.main',
                }
              }}
            />
          )}
        />
      </Box>
    </Box>
  );
}
