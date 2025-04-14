import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      setIsAuthenticated(false);
      navigate('/sign-in');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1])); // 解码 payload
      const currentTime = Date.now() / 1000;

      if (payload.exp < currentTime) {
        localStorage.clear();
        setIsAuthenticated(false);
        navigate('/sign-in');
      } else {
        setIsAuthenticated(true);
      }
    } catch (err) {
      localStorage.clear();
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

