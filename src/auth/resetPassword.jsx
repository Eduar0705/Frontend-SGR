import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/auth.service';
import swal from 'sweetalert2';
import '../assets/css/login.css';
import { useUI } from '../context/UIContext';

export default function ResetPassword() {
    const navigate = useNavigate();
    const location = useLocation();
    const { setLoading } = useUI();
    
    // Obtener cedula de la URL
    const query = new URLSearchParams(location.search);
    const initialCedula = query.get('cedula') || '';

    const [cedula, setCedula] = useState(initialCedula);
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

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
        
        if (code.length !== 6) {
            showError('El código debe tener 6 dígitos');
            return;
        }

        if (newPassword.length < 4) {
            showError('La contraseña debe tener al menos 4 caracteres');
            return;
        }

        setLoading(true);

        try {
            await authService.resetPassword(cedula, code, newPassword);
            showSuccess('Tu contraseña ha sido restablecida. Ya puedes iniciar sesión.');
            navigate('/login');
        } catch (err) {
            showError(err.message || 'Error al restablecer contraseña');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-wrapper">
            <div className="login-container">
                <div className="login-left">
                    <div className="login-branding">
                        <img src="/img/logoiujo.jpg" alt="Logo IUJO" />
                        <h1>Restablecer Contraseña 👋</h1>
                        <p className="brand-subtitle">Ingresa el código enviado a tu correo y tu nueva contraseña</p>
                    </div>
                </div>

                <div className="login-right">
                    <div className="login-card">
                        <form className="login-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="cedula">
                                    <i className="fas fa-id-card"></i> Cédula
                                </label>
                                <input
                                    id="cedula"
                                    type="text"
                                    value={cedula}
                                    onChange={(e) => setCedula(e.target.value)}
                                    required
                                    placeholder="Cédula"
                                    readOnly={!!initialCedula}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="code">
                                    <i className="fas fa-key"></i> Código de 6 dígitos
                                </label>
                                <input
                                    id="code"
                                    type="text"
                                    maxLength="6"
                                    placeholder="000000"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                    required
                                    autoComplete="off"
                                    style={{ textAlign: 'center', fontSize: '20px', letterSpacing: '5px' }}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="newPassword">
                                    <i className="fas fa-lock"></i> Nueva Contraseña
                                </label>
                                <div className="password-input-wrapper">
                                    <input
                                        id="newPassword"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
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
                                <Link to="/recovery" className="forgot-password">
                                    <i className="fas fa-arrow-left"></i> Solicitar otro código
                                </Link>
                            </div>

                            <button type="submit" className="btn-login">
                                <span className="btn-text" style={{ color: '#ffffff' }}>Restablecer Contraseña</span>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
