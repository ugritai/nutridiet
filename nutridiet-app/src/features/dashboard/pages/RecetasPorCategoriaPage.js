// src/pages/AlimentosPorCategoriaPage.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import Dashboard from '../Dashboard';
import RecipeCategoryCard from '../components/RecipeCategoryCard';

export default function RecetasPorCategoriaPage() {
  const { categoria } = useParams();

  return (
    <Dashboard>
      <RecipeCategoryCard categoria={categoria} />
    </Dashboard>
  );
}
