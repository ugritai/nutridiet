// src/App.js
import React from "react";
import NutritionistForm from "./NutritionistForm"; // Importa el componente del formulario

function App() {
  return (
    <div className="App">
      <h1>Nutritionist Registration</h1>
      <NutritionistForm /> {/* Usa el formulario en la interfaz */}
    </div>
  );
}

export default App;
