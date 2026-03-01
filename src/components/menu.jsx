import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useUI } from '../context/UIContext';

export default function Menu({ user }) {
    const location = useLocation();
    const { isSidebarOpen, closeSidebar } = useUI();

    if (!user) return null;

    return (
        <>
            {/* Overlay para móviles */}
            <div 
                className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} 
                onClick={closeSidebar}
            ></div>

            <aside className={`sidebar ${isSidebarOpen ? 'active' : ''}`} id="sidebar">
                <div className="sidebar-header">
                    <img src="/img/logoiujo.jpg" alt="logo IUJO" style={{ maxWidth: '140px', textAlign: 'center' }} />
                    <button className="sidebar-close-btn" onClick={closeSidebar}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {user.id_rol === 1 && (
                        <>
                            <NavLink to="/home" onClick={closeSidebar} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <i className="fas fa-chart-line"></i>
                                <span>Panel Principal</span>
                            </NavLink>
                            <NavLink to="/admin/rubricas" onClick={closeSidebar} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <i className="fas fa-table"></i>
                                <span>Rúbricas</span>
                            </NavLink>
                            <NavLink to="/admin/crear-rubricas" onClick={closeSidebar} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <i className="fas fa-plus-circle"></i>
                                <span>Crear Rúbrica</span>
                            </NavLink>
                            <NavLink to="/admin/evaluaciones" onClick={closeSidebar} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <i className="fas fa-clipboard-check"></i>
                                <span>Evaluaciones</span>
                            </NavLink>
                            <NavLink to="/admin/profesores" onClick={closeSidebar} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <i className="fas fa-chalkboard-teacher"></i>
                                <span>Docentes</span>
                            </NavLink>
                            <NavLink to="/admin/evaluacion-docente" onClick={closeSidebar} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <i className="fas fa-tasks"></i>
                                <span>Evaluacion Docente</span>
                            </NavLink>
                            <NavLink to="/admin/reportes" onClick={closeSidebar} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <i className="fas fa-file-alt"></i>
                                <span>Reportes</span>
                            </NavLink>
                        </>
                    )}

                    {user.id_rol === 2 && (
                        <>
                            <NavLink to="/teacher" onClick={closeSidebar} className={({ isActive }) => `nav-item ${isActive || location.pathname === '/teacher' ? 'active' : ''}`}>
                                <i className="fas fa-chart-line"></i>
                                <span>Panel Principal</span>
                            </NavLink>
                            <NavLink to="/teacher/rubricas" onClick={closeSidebar} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <i className="fas fa-table"></i>
                                <span>Mis Rúbricas</span>
                            </NavLink>
                            <NavLink to="/teacher/crear-rubricas" onClick={closeSidebar} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <i className="fas fa-plus-circle"></i>
                                <span>Crear Rúbrica</span>
                            </NavLink>
                            <NavLink to="/teacher/evaluaciones" onClick={closeSidebar} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <i className="fas fa-clipboard-check"></i>
                                <span>Evaluaciones</span>
                            </NavLink>
                            <NavLink to="/teacher/estudiantes" onClick={closeSidebar} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <i className="fas fa-users"></i>
                                <span>Estudiantes</span>
                            </NavLink>
                            <NavLink to="/teacher/reportes" onClick={closeSidebar} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <i className="fas fa-file-alt"></i>
                                <span>Reportes</span>
                            </NavLink>
                        </>
                    )}

                    {user.id_rol === 3 && (
                        <>
                            <NavLink to="/student" onClick={closeSidebar} className={({ isActive }) => `nav-item ${isActive || location.pathname === '/student' ? 'active' : ''}`}>
                                <i className="fas fa-chart-line"></i>
                                <span>Panel Principal</span>
                            </NavLink>
                            <NavLink to="/student/calificaciones" onClick={closeSidebar} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <i className="fas fa-graduation-cap"></i>
                                <span>Mis Calificaciones</span>
                            </NavLink>
                            <NavLink to="/student/evaluaciones" onClick={closeSidebar} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                                <i className="fas fa-clipboard-check"></i>
                                <span>Mis Evaluaciones</span>
                            </NavLink>
                        </>
                    )}

                </nav>
                <div className="sidebar-footer">
                    <div className="user-profile">
                        <div className="user-avatar">
                            <i className="fas fa-user"></i>
                        </div>
                        <div className="user-info">
                            <div className="user-name">{user.nombre || user.cedula || 'Usuario'}</div>
                            <div className="user-role">
                                {user.id_rol === 1 ? 'Administrador' : user.id_rol === 2 ? 'Docente' : 'Estudiante'}
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}