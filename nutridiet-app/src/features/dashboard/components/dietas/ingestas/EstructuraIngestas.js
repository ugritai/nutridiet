export const obtenerEstructuraIngesta = (tipo) => {
  const estructuras = {
    '3 comidas': {
      Desayuno: ['primer plato', 'bebida'],
      Almuerzo: ['entrante', 'primer plato', 'segundo plato', 'postre', 'bebida'],
      Cena: ['entrante', 'primer_plato', 'segundo plato', 'postre', 'bebida'],
    },
    '5 comidas': {
      Desayuno: ['primer plato', 'bebida'],
      'Media mañana': ['primer plato', 'bebida'],
      Almuerzo: ['entrante', 'primer plato', 'segundo plato', 'postre', 'bebida'],
      Merienda: ['primer plato', 'bebida'],
      Cena: ['entrante', 'primer plato', 'segundo plato', 'postre', 'bebida'],
    },
  };

  const estructura = estructuras[tipo] || {};

  return Object.fromEntries(
    Object.entries(estructura).map(([ingesta, subtipos]) => [
      ingesta.toLowerCase(),
      subtipos.map(s => s.toLowerCase()),
    ])
  );
};
