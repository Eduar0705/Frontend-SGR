import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

/**
 * Componente para proteger rutas según autenticación y rol de usuario.
 * 
 * @param {Array<number>} allowedRoles - IDs de roles permitidos (ej. [1] para Admin, [2] para Docente, [3] para Estudiante)
 * @param {React.ReactNode} children - Componente opcional (si se usa Outlet, no hace falta)
 */
export default function ProtectedRoute({ allowedRoles, children }) {
    const location = useLocation();

    const token = localStorage.getItem('token');
    let user = null;
    try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            user = JSON.parse(storedUser);
        }
    } catch {
        user = null;
    }

    // 1. Si no hay token o usuario válido, redirigir al login
    if (!token || !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    const userRol = Number(user.id_rol);

    // 2. Si el rol no está en los permitidos, redirigir al home correspondiente de su rol
    if (allowedRoles && !allowedRoles.includes(userRol)) {
        if (userRol === 1) {
            return <Navigate to="/home" replace />;
        } else if (userRol === 2) {
            return <Navigate to="/teacher" replace />;
        } else if (userRol === 3) {
            return <Navigate to="/student" replace />;
        } else {
            return <Navigate to="/login" replace />;
        }
    }

    // 3. Acceso autorizado
    return children ? children : <Outlet />;
}
