import { Navigate } from 'react-router-dom';
import React from 'react';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = (localStorage.getItem('userEmail') && localStorage.getItem('userName') || sessionStorage.getItem('userEmail') && sessionStorage.getItem('userName'));

  return isAuthenticated ? children : <Navigate to="/sign-in" replace />;
};

export default ProtectedRoute;