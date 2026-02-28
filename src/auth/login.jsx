import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import swal from 'sweetalert2';
import '../assets/css/login.css';

export default function Login() {
    const navigate = useNavigate();
    const [cedula, setCedula] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleCedulaChange = (e) => {
        const value = e.target.value.replace(/\D/g, '');
        if (value.length <= 9) {
            setCedula(value);
        }
    };

    function showError(mensaje){
        swal.fire({
            icon: 'error',
            title: 'Error',
            text: mensaje,
        });
    }
    
    function showSuccess(mensaje){
        swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: mensaje,
        });
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (cedula.length < 7) {
            showError('La cédula debe tener al menos 7 dígitos');
            return;
        }

        setLoading(true);

        try {
            const response = await authService.login(cedula, password);
            
            // Guardar usuario y token
            localStorage.setItem('user', JSON.stringify(response.user));
            localStorage.setItem('token', response.token);

            const nombreUsuario = response.user.nombre || response.user.cedula || 'Usuario';
            showSuccess(`¡Bienvenido(a), ${nombreUsuario}!`);
            
            // Redirigir según el rol
            const idRol = response.user.id_rol;
            if (idRol === 1) {
                navigate('/home'); // Administrador
            } else if (idRol === 2) {
                navigate('/teacher'); // Docente
            } else if (idRol === 3) {
                navigate('/student'); // Estudiante
            } else {
                navigate('/');
            }
        } catch (err) {
            showError(err.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };
    let color = { color: '#ffffff' };
    return (
        <div className="login-wrapper">
            <div className="login-container">
            {/* Header con logo */}
            <div className="login-left">
                <div className="login-branding">
                    <img src="/img/logoiujo.jpg" alt="Logo IUJO" />
                    <h1>Bienvenido a Sistema de Gestión de Rúbricas! 👋</h1>
                    <p className="brand-subtitle">Por favor, coloca tu usuario y contraseña</p>
                </div>
            </div>

            {/* Formulario */}
            <div className="login-right">
                <div className="login-card">

                    <form className="login-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="cedula">
                                <i className="fas fa-id-card"></i> Usuario
                            </label>
                            <input
                                id="cedula"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                placeholder="12345678"
                                value={cedula}
                                onChange={handleCedulaChange}
                                required
                                autoComplete="off"
                            />
                            <span style={{ fontSize: '12px', color: '#dc2626', marginTop: '-4px' }}>
                                El mínimo de dígitos son 7 y el máximo 9
                            </span>
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">
                                <i className="fas fa-lock"></i> Contraseña
                            </label>
                            <div className="password-input-wrapper">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>
                        </div>

                        <div className="form-options">
                            <Link to="/" className="forgot-password">
                                <i className="fas fa-arrow-left"></i> Volver
                            </Link>
                            <a href="#" className="forgot-password">
                                ¿Olvidaste tu contraseña?
                            </a>
                        </div>

                        <button
                            type="submit"
                            className={`btn-login ${loading ? 'loading' : ''}`}
                            disabled={loading}
                        >
                            <span className="btn-text" style={color}>Login</span>
                            <span className="btn-loader">
                                <i className="fas fa-spinner fa-spin"></i> Ingresando...
                            </span>
                        </button>
                    </form>
                </div>
            </div>
            </div>
        </div>
    );
}