import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Menu from '../components/menu';
import Header from '../components/header';
import '../assets/css/home.css';

export default function TeacherEvaluaciones() {
    const navigate = useNavigate();
    const [user] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    if (!user) return null;

    return (
        <main className="main-content">
            <Menu user={user} />
            <div className="content-wrapper" style={{ width: '100%' }}>
                <Header title="Mis Evaluaciones" user={user} onLogout={() => navigate('/login')} />
                <div className="view active" style={{ padding: '20px' }}>
                    <div className="card" style={{ padding: '20px', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <h2>Evaluaciones Realizadas</h2>
                        <p>Consulta el historial de evaluaciones aplicadas a tus estudiantes.</p>
                    </div>
                </div>
            </div>
        </main>
    );
}
