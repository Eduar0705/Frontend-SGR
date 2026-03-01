import React, { useState, useEffect } from 'react';
import Header from './header';
import Menu from './menu';
import userService from '../services/user.service';
import Swal from 'sweetalert2';
import '../assets/css/home.css';

export default function UserProfile({ user: initialUser, onLogout }) {
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const response = await userService.getProfile();
                if (response.success) {
                    setProfileData(response.data);
                }
            } catch (error) {
                console.error('Error loading profile:', error);
                Swal.fire('Error', 'No se pudieron cargar los datos del perfil', 'error');
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, []);

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            return Swal.fire('Error', 'Las contraseñas no coinciden', 'error');
        }
        if (newPassword.length < 6) {
            return Swal.fire('Error', 'La contraseña debe tener al menos 6 caracteres', 'error');
        }

        try {
            const response = await userService.changePassword(newPassword);
            if (response.status === 'ok') {
                Swal.fire('Éxito', 'Contraseña actualizada correctamente', 'success');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                Swal.fire('Error', response.mensaje || 'Error al actualizar la contraseña', 'error');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            Swal.fire('Error', 'Ocurrió un error al cambiar la contraseña', 'error');
        }
    };

    if (loading) return <div className="loading">Cargando...</div>;

    return (
        <main className="main-content">
            <Menu user={initialUser} />
            <div className="content-wrapper">
                <Header title="Configuración de Perfil" user={initialUser} onLogout={onLogout} />
                
                <div className="view active" style={{ padding: '20px' }}>
                    <div className="profile-container" style={{ 
                        maxWidth: '800px', 
                        margin: '0 auto', 
                        background: '#fff', 
                        padding: '30px', 
                        borderRadius: '12px', 
                        boxShadow: '0 4px 6px rgba(0,0,0,0.05)' 
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
                            <div style={{ 
                                width: '80px', 
                                height: '80px', 
                                background: '#3b82f6', 
                                color: '#fff', 
                                borderRadius: '50%', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                fontSize: '32px',
                                fontWeight: 'bold'
                            }}>
                                {profileData?.nombre?.charAt(0)}{profileData?.apellido?.charAt(0)}
                            </div>
                            <div>
                                <h2 style={{ margin: 0 }}>{profileData?.nombre} {profileData?.apellido}</h2>
                                <p style={{ color: '#666', margin: '5px 0' }}>{profileData?.rol_nombre}</p>
                            </div>
                        </div>

                        <div className="profile-info" style={{ marginBottom: '40px' }}>
                            <h3 style={{ borderLeft: '4px solid #3b82f6', paddingLeft: '10px', marginBottom: '20px' }}>Datos Personales</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 'bold', color: '#666', marginBottom: '5px' }}>Cédula</label>
                                    <p style={{ padding: '10px', background: '#f8fafc', borderRadius: '6px' }}>{profileData?.cedula}</p>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 'bold', color: '#666', marginBottom: '5px' }}>Correo Electrónico</label>
                                    <p style={{ padding: '10px', background: '#f8fafc', borderRadius: '6px' }}>{profileData?.email}</p>
                                </div>
                            </div>
                        </div>

                        <div className="password-change">
                            <h3 style={{ borderLeft: '4px solid #3b82f6', paddingLeft: '10px', marginBottom: '20px' }}>Cambiar Contraseña</h3>
                            <form onSubmit={handleChangePassword} style={{ maxWidth: '400px' }}>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px' }}>Nueva Contraseña</label>
                                    <input 
                                        type="password" 
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                                        required
                                    />
                                </div>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px' }}>Confirmar Nueva Contraseña</label>
                                    <input 
                                        type="password" 
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                                        required
                                    />
                                </div>
                                <button type="submit" style={{ 
                                    background: '#3b82f6', 
                                    color: '#fff', 
                                    border: 'none', 
                                    padding: '12px 24px', 
                                    borderRadius: '8px', 
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}>
                                    Actualizar Contraseña
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
