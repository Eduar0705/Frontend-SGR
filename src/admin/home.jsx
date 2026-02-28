import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Menu from '../components/menu';
import Header from '../components/header';
import { dashboardService } from '../services/dashboard.service';
import '../assets/css/home.css';

export default function Home() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (!storedUser || !token) {
            navigate('/login');
        } else {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser.id_rol !== 1) {
                // Si no es administrador, redirigir (luego se puede redirigir a sus paneles respectivos)
                navigate('/login');
            } else {
                setUser(parsedUser);
                loadStats();
            }
        }
    }, [navigate]);

    const loadStats = async () => {
        try {
            const data = await dashboardService.getStats();
            setStats(data);
        } catch (error) {
            console.error('Error al cargar métricas:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/login');
    };

    if (!user) return null; // o un spinner de carga

    return (
        <main className='main-content'>
            <Menu user={user} />
            <div className="content-wrapper" style={{ width: '100%' }}>
                <Header title="Panel Principal" user={user} onLogout={handleLogout} />
                
                <div className="view active" id="dashboard">
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon primary">
                                <i className="fas fa-table"></i>
                            </div>
                            <div className="stat-content">
                                <div className="stat-value">
                                    {stats ? stats.totalRubricas : '...'}
                                </div>
                                <div className="stat-label">Rúbricas Activas</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon warning">
                                <i className="fas fa-hourglass-half"></i>
                            </div>
                            <div className="stat-content">
                                <div className="stat-value">
                                    {stats ? stats.totalEvaluacionesPendientes : '...'}
                                </div>
                                <div className="stat-label">Evaluaciones Pendientes</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon success">
                                <i className="fas fa-users"></i>
                            </div>
                            <div className="stat-content">
                                <div className="stat-value">
                                    {stats ? stats.totalProfesores : '...'}
                                </div>
                                <div className="stat-label">Docentes</div>
                            </div>
                        </div>
                    </div>

                    <div className="content-grid">
                        <div className="card">
                            <div className="card-header">
                                <h2 className="card-title">Rúbricas Recientes</h2>
                                <a href="/admin/rubricas" className="btn-text">Ver todas</a>
                            </div>
                            <div className="card-content">
                                <div className="rubrica-item">
                                    <div className="rubrica-icon">
                                        <i className="fas fa-file-alt"></i>
                                    </div>
                                    <div className="rubrica-info">
                                        <div className="rubrica-name">No hay rúbricas recientes</div>
                                        <div className="rubrica-meta">Crea tu primera rúbrica</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h2 className="card-title">Actividad Reciente</h2>
                            </div>
                            <div className="card-content">
                                <div className="activity-item">
                                    <div className="activity-icon primary">
                                        <i className="fas fa-info-circle"></i>
                                    </div>
                                    <div className="activity-content">
                                        <div className="activity-text">No hay actividad reciente</div>
                                        <div className="activity-time">Las evaluaciones completadas aparecerán aquí</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}