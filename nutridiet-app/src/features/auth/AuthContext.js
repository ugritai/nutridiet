import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Buscar en localStorage primero, y si no está, en sessionStorage
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');

    if (!token) {
      setIsAuthenticated(false);
      navigate('/sign-in');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1])); 
      const currentTime = Date.now() / 1000;

      if (payload.exp < currentTime) {
        localStorage.removeItem('accessToken');
        sessionStorage.removeItem('accessToken');
        setIsAuthenticated(false);
        navigate('/sign-in');
      } else {
        setIsAuthenticated(true);
      }
    } catch (err) {
      localStorage.removeItem('accessToken');
      sessionStorage.removeItem('accessToken');
      setIsAuthenticated(false);
      navigate('/sign-in');
    }
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);