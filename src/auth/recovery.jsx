import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/auth.service';
import swal from 'sweetalert2';
import '../assets/css/login.css';
import { useUI } from '../context/UIContext';

export default function Recovery() {
    const navigate = useNavigate();
    const { setLoading } = useUI();
    const [cedula, setCedula] = useState('');
    const [email, setEmail] = useState('');

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
            title: 'Código Generado',
            text: mensaje,
        });
    }

    const handleCedulaChange = (e) => {
        const value = e.target.value.replace(/\D/g, '');
        if (value.length <= 9) {
            setCedula(value);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (cedula.length < 7) {
            showError('La cédula debe tener al menos 7 dígitos');
            return;
        }

        setLoading(true);

        try {
            const response = await authService.requestRecovery(cedula, email);
            showSuccess(response.message);
            // Redirigir a la vista de reset pasándole la cédula
            navigate(`/reset-password?cedula=${cedula}`);
        } catch (err) {
            showError(err.message || 'Error al solicitar recuperación');
        } finally {
            setLoading(false);
        }
    };

    const isCedulaValid = cedula.length >= 7 && cedula.length <= 9;
    const cedulaStyle = cedula.length > 0 
        ? (isCedulaValid 
            ? { borderColor: '#28a745', boxShadow: '0 0 0 0.2rem rgba(40, 167, 69, 0.25)' } 
            : { borderColor: '#dc3545', boxShadow: '0 0 0 0.2rem rgba(220, 53, 69, 0.25)' })
        : {};

    return (
        <div className="login-wrapper">
            <div className="login-container">
                <div className="login-left">
                    <div className="login-branding">
                        <img src="/img/logoiujo.jpg" alt="Logo IUJO" />
                        <h1>Recuperar Contraseña 👋</h1>
                        <p className="brand-subtitle">Ingresa tus datos para recibir un código de recuperación</p>
                    </div>
                </div>

                <div className="login-right">
                    <div className="login-card">
                        <form className="login-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="cedula">
                                    <i className="fas fa-id-card"></i> Cédula de Identidad
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
                                    style={cedulaStyle}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="email">
                                    <i className="fas fa-envelope"></i> Correo Electrónico
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="tu-correo@ejemplo.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-options">
                                <Link to="/login" className="forgot-password">
                                    <i className="fas fa-arrow-left"></i> Volver al Login
                                </Link>
                            </div>

                            <button type="submit" className="btn-login">
                                <span className="btn-text" style={{ color: '#ffffff' }}>Enviar Código</span>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
