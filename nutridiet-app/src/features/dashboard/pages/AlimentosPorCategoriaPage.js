// src/pages/AlimentosPorCategoriaPage.js
import React from 'react';
import { useParams } from 'react-router-dom';
import Dashboard from '../Dashboard';
import FoodCategoryCard from '../components/FoodCategoryCard';

/**
 * Vista dinámica que renderiza la lista de alimentos filtrada por una categoría específica.
 * Extrae la categoría directamente de los parámetros de la URL.
 */
export default function AlimentosPorCategoriaPage() {
  const { categoria } = useParams();

  return (
    <Dashboard>
      <FoodCategoryCard categoria={categoria} />
    </Dashboard>
  );
}