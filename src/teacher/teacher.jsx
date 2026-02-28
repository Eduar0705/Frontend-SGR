import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Menu from '../components/menu';
import Header from '../components/header';

export default function Teacher() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (!storedUser || !token) {
            navigate('/login');
        } else {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser.id_rol !== 2 && parsedUser.id_rol !== 1) {
                navigate('/login');
            } else {
                setUser(parsedUser);
            }
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/login');
    };

    if (!user) return null;

    return (
        <main className='main-content'>
            <Menu user={user} />
            <div className="content-wrapper" style={{ width: '100%' }}>
                <Header title="Panel Docente" user={user} onLogout={handleLogout} />
                
                <div className="view active">
                    <div className="content-grid">
                        <div className="card">
                            <div className="card-header">
                                <h2 className="card-title">Bienvenido a tu panel docente</h2>
                            </div>
                            <div className="card-content">
                                <p>Aquí puedes gestionar tus rúbricas y evaluar a tus estudiantes.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}