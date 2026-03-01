import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useUI } from '../context/UIContext';

export default function Header({ title, user, onLogout }) {
    const navigate = useNavigate();
    const { toggleSidebar } = useUI();

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
        }).then((result) => {
            if (result.isConfirmed) {
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
                <h1 className="page-title" id="pageTitle"> {title || 'Inicio'} </h1>
            </div>
            <div className="header-right">
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
                <button className="header-btn" title="Notificaciones" id="notificaciones" onClick={() => console.log('Abrir notificaciones')} style={{position: 'relative'}}>
                    <i className="fas fa-bell"></i>
                    <span id="notificationBadge" className="notification-badge"></span>
                </button>
                <button className="header-btn" id="salir" title="Salir" onClick={cerrarSesion}>
                    <i className="fas fa-sign-out-alt"></i>
                </button>
            </div>
        </header>
    );
}