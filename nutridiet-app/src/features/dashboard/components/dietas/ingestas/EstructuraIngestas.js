export const obtenerEstructuraIngesta = (tipo) => {
    const estructuras = {
      '3 comidas': {
        Desayuno: ['primer_plato', 'bebida'],
        Almuerzo: ['entrante', 'primer_plato', 'segundo_plato', 'postre', 'bebida'],
        Cena: ['entrante', 'primer_plato', 'segundo_plato', 'postre', 'bebida'],
      },
      '5 comidas': {
        Desayuno: ['primer_plato', 'bebida'],
        'Media mañana': ['primer_plato', 'bebida'],
        Almuerzo: ['entrante', 'primer_plato', 'segundo_plato', 'postre', 'bebida'],
        Merienda: ['primer_plato', 'bebida'],
        Cena: ['entrante', 'primer_plato', 'segundo_plato', 'postre', 'bebida'],
      },
    };
    return estructuras[tipo] || {};
  };