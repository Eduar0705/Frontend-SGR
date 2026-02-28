import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Menu({ user }) {
    if (!user) return null;

    return (
        <aside className="sidebar" id="sidebar">
            <div className="sidebar-header">
                <img src="/img/logoiujo.jpg" alt="logo IUJO" style={{ maxWidth: '200px', textAlign: 'center' }} />
                <button className="sidebar-toggle" id="sidebarToggle">
                    <i className="fas fa-bars"></i>
                </button>
            </div>

            <nav className="sidebar-nav">
                {user.id_rol === 1 && (
                    <>
                        <NavLink to="/home" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <i className="fas fa-chart-line"></i>
                            <span>Panel Principal</span>
                        </NavLink>
                        <NavLink to="/admin/rubricas" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <i className="fas fa-table"></i>
                            <span>Rúbricas</span>
                        </NavLink>
                        <NavLink to="/admin/createrubricas" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <i className="fas fa-plus-circle"></i>
                            <span>Crear Rúbrica</span>
                        </NavLink>
                        <NavLink to="/admin/evaluaciones" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <i className="fas fa-clipboard-check"></i>
                            <span>Evaluaciones</span>
                        </NavLink>
                        <NavLink to="/admin/profesores" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <i className="fas fa-chalkboard-teacher"></i>
                            <span>Docentes</span>
                        </NavLink>
                        <NavLink to="/admin/evaluacion-docente" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <i className="fas fa-tasks"></i>
                            <span>Evaluacion Docente</span>
                        </NavLink>
                        <NavLink to="/admin/reportes" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <i className="fas fa-file-alt"></i>
                            <span>Reportes</span>
                        </NavLink>
                    </>
                )}

                {user.id_rol === 2 && (
                    <>
                        <NavLink to="/teacher" className={({ isActive }) => `nav-item ${isActive || location.pathname === '/teacher' ? 'active' : ''}`}>
                            <i className="fas fa-chart-line"></i>
                            <span>Panel Principal</span>
                        </NavLink>
                        <NavLink to="/teacher/rubricas" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <i className="fas fa-table"></i>
                            <span>Mis Rúbricas</span>
                        </NavLink>
                        <NavLink to="/teacher/createrubricas" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <i className="fas fa-plus-circle"></i>
                            <span>Crear Rúbrica</span>
                        </NavLink>
                        <NavLink to="/teacher/evaluacion" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <i className="fas fa-clipboard-check"></i>
                            <span>Evaluaciones</span>
                        </NavLink>
                        <NavLink to="/teacher/students" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <i className="fas fa-users"></i>
                            <span>Estudiantes</span>
                        </NavLink>
                        <NavLink to="/teacher/report" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <i className="fas fa-file-alt"></i>
                            <span>Reportes</span>
                        </NavLink>
                    </>
                )}

                {user.id_rol === 3 && (
                    <>
                        <NavLink to="/student" className={({ isActive }) => `nav-item ${isActive || location.pathname === '/student' ? 'active' : ''}`}>
                            <i className="fas fa-chart-line"></i>
                            <span>Panel Principal</span>
                        </NavLink>
                        <NavLink to="/students/calificaciones" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                            <i className="fas fa-graduation-cap"></i>
                            <span>Mis Calificaciones</span>
                        </NavLink>
                        <NavLink to="/student/evaluaciones" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
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
    );
}