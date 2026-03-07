import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useUI } from '../context/UIContext';
import notificacionesService from '../services/notificaciones.service';
import periodosService from '../services/periodos.service';
import { authService } from '../services/auth.service';

export default function Header({ title, user, onLogout }) {
    const navigate = useNavigate();
    const { toggleSidebar, periodoActual, updatePeriodo } = useUI();
    const [notificaciones, setNotificaciones] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [periodos, setPeriodos] = useState([]);
    const loadNotifications = async () => {
        try {
            const result = await notificacionesService.getNotifications();
            if (result.success && result.data) {
                setNotificaciones(result.data.notifications || []);
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    };

    const loadPeriodos = async () => {
        try {
            const result = await periodosService.getPeriodos();
            const lista = result.data.data

            setPeriodos(lista);

            if (!periodoActual && lista.length > 0) {
                updatePeriodo(lista[0].codigo);
            }
        } catch (error) {
            console.error('Error loading periodos:', error);
            setPeriodos([]);
        }
    };

    useEffect(() => {
        loadNotifications();
        loadPeriodos();
        const interval = setInterval(loadNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const handlePeriodoChange = (e) => {
        const nuevoPeriodo = e.target.value;
        updatePeriodo(nuevoPeriodo);
        // Recargar la página actual para que los datos se filtren por el nuevo periodo
        //window.location.reload();
    };

    const handleMarkAsRead = async (id) => {
        try {
            await notificacionesService.markAsRead(id);
            loadNotifications();
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificacionesService.markAllAsRead();
            loadNotifications();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const unreadCount = notificaciones.filter(n => !n.leido).length;

    function cerrarSesion() {
        Swal.fire({
            title: '¿Estás seguro?',
            text: "Quieres cerrar sesión",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, cerrar sesión',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                if (user && user.cedula) {
                    await authService.logout(user.cedula);
                }
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                onLogout();
                navigate('/');
            }
        });
    }

    return (
        <header className="header">
            <div className="header-left">
                <button className="mobile-menu-toggle" id="mobileMenuToggle" onClick={toggleSidebar}>
                    <i className="fas fa-bars"></i>
                </button>
                <h1 className="page-title" id="pageTitle">{title || 'Inicio'}</h1>

            </div>

            
            <div className="header-right">
            <label>Periodo: </label>
                <div className="form-header">
                    
                    <select id="selector_periodo" className="form-select" value={periodoActual || ''} onChange={handlePeriodoChange}>
                        {periodos.length === 0 ? (
                            <option value="" disabled>Cargando periodos...</option>
                        ) : (
                            periodos.map(p => (
                                <option key={p.codigo} value={p.codigo}>
                                    {p.codigo}
                                </option>
                            ))
                        )}
                    </select>
                </div>
                <button
                    className="header-btn"
                    title="Configuración"
                    onClick={() => {
                        if (user?.id_rol === 1) navigate('/admin/configuracion');
                        else if (user?.id_rol === 2) navigate('/teacher/config');
                        else if (user?.id_rol === 3) navigate('/student/config');
                        else navigate('/config');
                    }}>
                    <i className="fas fa-cog"></i>
                </button>

                <div className="notification-wrapper" style={{ position: 'relative' }}>
                    <button
                        className="header-btn"
                        title="Notificaciones"
                        id="notificaciones"
                        onClick={() => setShowDropdown(!showDropdown)}
                    >
                        <i className="fas fa-bell"></i>
                        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                    </button>
                    {showDropdown && (
                        <div className="notification-dropdown">
                            <div className="notification-header">
                                <h3>Notificaciones</h3>
                                {unreadCount > 0 && (
                                    <button onClick={handleMarkAllAsRead}>Marcar todo como leído</button>
                                )}
                            </div>
                            <div className="notification-list">
                                {notificaciones.length === 0 ? (
                                    <div className="no-notifications">No tienes notificaciones</div>
                                ) : (
                                    notificaciones.map(n => (
                                        <div
                                            key={n.id}
                                            className={`notification-item ${!n.leido ? 'unread' : ''}`}
                                            onClick={() => !n.leido && handleMarkAsRead(n.id)}
                                        >
                                            <div className="notification-content">
                                                <p className="notif-message">{n.mensaje}</p>
                                                <span className="notif-date">{new Date(n.fecha).toLocaleString()}</span>
                                            </div>
                                            {!n.leido && <div className="unread-dot"></div>}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <button className="header-btn" id="salir" title="Salir" onClick={cerrarSesion}>
                    <i className="fas fa-sign-out-alt"></i>
                </button>
            </div>
        </header>
    );
}