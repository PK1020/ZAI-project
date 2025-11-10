import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Ten komponent chroni ścieżki - jeśli user nie jest zalogowany,
// przekierowuje go do /login
const ProtectedRoute = () => {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Outlet renderuje komponent-dziecko (np. Profile)
    return <Outlet />;
};

export default ProtectedRoute;

