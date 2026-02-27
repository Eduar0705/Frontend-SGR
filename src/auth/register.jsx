import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../assets/css/style.css';

export default function Register() {
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        cedula: '',
        email: '',
        rol: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.password !== formData.confirmPassword) {
            alert('Las contraseñas no coinciden');
            return;
        }

        setLoading(true);

        // TODO: Conectar con el backend
        console.log('Register attempt:', formData);

        setTimeout(() => {
            setLoading(false);
        }, 1500);
    };

    return (
        <div className="auth-page">
            <div className="auth-card" style={{ maxWidth: '520px' }}>
                <Link to="/login" className="auth-back">
                    <i className="fas fa-arrow-left"></i>
                    Volver al login
                </Link>

                <div className="auth-logo">
                    <img src="/img/logoiujo.jpg" alt="Logo IUJO" />
                </div>

                <h2 className="auth-title">Crear Cuenta</h2>
                <p className="auth-subtitle">Completa el formulario para registrarte en el sistema</p>

                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label" htmlFor="nombre">Nombre</label>
                            <div className="input-icon-wrapper">
                                <i className="fas fa-user"></i>
                                <input
                                    id="nombre"
                                    name="nombre"
                                    type="text"
                                    className="form-input"
                                    placeholder="Juan"
                                    value={formData.nombre}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="apellido">Apellido</label>
                            <div className="input-icon-wrapper">
                                <i className="fas fa-user"></i>
                                <input
                                    id="apellido"
                                    name="apellido"
                                    type="text"
                                    className="form-input"
                                    placeholder="Pérez"
                                    value={formData.apellido}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label" htmlFor="cedula">Cédula</label>
                            <div className="input-icon-wrapper">
                                <i className="fas fa-id-card"></i>
                                <input
                                    id="cedula"
                                    name="cedula"
                                    type="text"
                                    className="form-input"
                                    placeholder="V-12345678"
                                    value={formData.cedula}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="rol">Rol</label>
                            <div className="input-icon-wrapper">
                                <i className="fas fa-user-tag"></i>
                                <select
                                    id="rol"
                                    name="rol"
                                    className="form-select"
                                    value={formData.rol}
                                    onChange={handleChange}
                                    required
                                    style={{ paddingLeft: '2.75rem' }}
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="docente">Docente</option>
                                    <option value="estudiante">Estudiante</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="reg-email">Correo Electrónico</label>
                        <div className="input-icon-wrapper">
                            <i className="fas fa-envelope"></i>
                            <input
                                id="reg-email"
                                name="email"
                                type="email"
                                className="form-input"
                                placeholder="correo@iujo.edu.ve"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label" htmlFor="reg-password">Contraseña</label>
                            <div className="input-icon-wrapper">
                                <i className="fas fa-lock"></i>
                                <input
                                    id="reg-password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-input"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="confirmPassword">Confirmar</label>
                            <div className="input-icon-wrapper">
                                <i className="fas fa-lock"></i>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-input"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                            type="checkbox"
                            id="showPass"
                            checked={showPassword}
                            onChange={() => setShowPassword(!showPassword)}
                        />
                        <label htmlFor="showPass" style={{ fontSize: '0.85rem', color: 'var(--text-light)', cursor: 'pointer' }}>
                            Mostrar contraseñas
                        </label>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-auth"
                        disabled={loading}
                    >
                        {loading ? (
                            <><i className="fas fa-spinner fa-spin icon-margin"></i>Registrando...</>
                        ) : (
                            <><i className="fas fa-user-plus icon-margin"></i>Crear Cuenta</>
                        )}
                    </button>
                </form>

                <div className="auth-divider">
                    <span>¿Ya tienes una cuenta?</span>
                </div>

                <div className="auth-footer">
                    <Link to="/login">Iniciar Sesión</Link>
                </div>
            </div>
        </div>
    );
}
