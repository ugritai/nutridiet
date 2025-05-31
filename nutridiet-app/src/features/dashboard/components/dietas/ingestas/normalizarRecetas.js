export const normalizeRecipes = (recipesPorTipo) => {
    const normalized = {};
    for (const tipo in recipesPorTipo) {
      normalized[tipo] = recipesPorTipo[tipo].map((receta) => ({
        name: receta.name ?? receta.nombre ?? '',
        kcal: parseFloat(receta.kcal),
        pro: parseFloat(receta.pro),
        car: parseFloat(receta.car),
      }));
    }
    return normalized;
  };
  