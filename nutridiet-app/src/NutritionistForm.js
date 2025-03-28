// src/NutritionistForm.js
import React, { useState } from "react";
import axios from "axios";

const NutritionistForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    language: "",
  });

  // Maneja los cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Maneja el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Envia los datos al backend de FastAPI
      const response = await axios.post(
        "http://localhost:8000/register_nutritionist", // Ruta de FastAPI
        formData
      );
      console.log("Response:", response.data);
      alert("Nutritionist registered successfully");
    } catch (error) {
      console.error("Error:", error.response ? error.response.data : error);
      alert("Error registering nutritionist");
    }
  };

  return (
    <div>
      <h1>Register Nutritionist</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Phone:</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Language:</label>
          <input
            type="text"
            name="language"
            value={formData.language}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit">Register Nutritionist</button>
      </form>
    </div>
  );
};

export default NutritionistForm;
