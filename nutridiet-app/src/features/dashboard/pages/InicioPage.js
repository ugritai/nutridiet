// src/pages/InicioPage.js
import Dashboard from '../Dashboard';
import MainGrid from '../components/MainGrid'; 

/**
 * Vista principal tras el inicio de sesión.
 * Renderiza el dashboard principal (MainGrid).
 */
export default function InicioPage() {
  return (
    <Dashboard>
      <MainGrid />
    </Dashboard>
  );
}