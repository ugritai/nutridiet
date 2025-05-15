// src/pages/AlimentosPorCategoriaPage.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import Dashboard from '../Dashboard';
import FoodCategoryCard from '../components/FoodCategoryCard';

export default function AlimentosPorCategoriaPage() {
  const { categoria } = useParams();

  return (
    <Dashboard>
      <FoodCategoryCard categoria={categoria} />
    </Dashboard>
  );
}
