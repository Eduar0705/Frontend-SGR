import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Menu from '../components/menu';
import Header from '../components/header';
import dashboardService from '../services/dashboard.service';
import '../assets/css/home.css';

export default function Student() {
    const navigate = useNavigate();
    const [user] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const stats = await dashboardService.getStudentStats();
            setData(stats);
        } catch (error) {
            console.error('Error al cargar datos del estudiante:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!user || !token) {
            navigate('/login');
        } else if (user.id_rol !== 3 && user.id_rol !== 1) {
            navigate('/login'); 
        } else {
            loadData();
        }
    }, [navigate, user, loadData]);

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
                <Header title="Panel Estudiantil" user={user} onLogout={handleLogout} />
                
                <div className="view active" id="student-dashboard" style={{ padding: '30px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '50px' }}>
                            <i className="fas fa-spinner fa-spin fa-2x" style={{ color: '#1e3a8a' }}></i>
                            <p>Cargando tu progreso académico...</p>
                        </div>
                    ) : (
                        <>
                            {/* Resumen de estadísticas */}
                            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                                <div className="stat-card card">
                                    <div className="stat-icon primary" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                                        <i className="fas fa-book-reader"></i>
                                    </div>
                                    <div className="stat-content">
                                        <div className="stat-value" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                            {data?.stats?.rubricasActivas || 0}
                                        </div>
                                        <div className="stat-label" style={{ color: '#64748b' }}>Rúbricas Habilitadas</div>
                                    </div>
                                </div>
                                <div className="stat-card card">
                                    <div className="stat-icon success" style={{ background: '#f0fdf4', color: '#15803d' }}>
                                        <i className="fas fa-clipboard-check"></i>
                                    </div>
                                    <div className="stat-content">
                                        <div className="stat-value" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                            {data?.stats?.evaluacionesCompletadas || 0}
                                        </div>
                                        <div className="stat-label" style={{ color: '#64748b' }}>Evaluaciones Realizadas</div>
                                    </div>
                                </div>
                                <div className="stat-card card">
                                    <div className="stat-icon warning" style={{ background: '#fffbeb', color: '#b45309' }}>
                                        <i className="fas fa-clock"></i>
                                    </div>
                                    <div className="stat-content">
                                        <div className="stat-value" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                            {data?.stats?.evaluacionesPendientes || 0}
                                        </div>
                                        <div className="stat-label" style={{ color: '#64748b' }}>Tareas Pendientes</div>
                                    </div>
                                </div>
                            </div>

                            <div className="content-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                                {/* Evaluadas Recientemente */}
                                <div className="card" style={{ padding: '25px' }}>
                                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                        <h2 className="card-title"><i className="fas fa-star" style={{ color: '#fbbf24' }}></i> Últimas Calificaciones</h2>
                                    </div>
                                    <div className="card-content">
                                        {data?.evaluacionesRecientes && data.evaluacionesRecientes.length > 0 ? (
                                            data.evaluacionesRecientes.map((evaluacion, idx) => (
                                                <div key={idx} className="evaluacion-recent-item" style={{ padding: '15px 0', borderBottom: '1px solid #f1f5f9' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div>
                                                            <div style={{ fontWeight: '600' }}>{evaluacion.nombre_rubrica}</div>
                                                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{evaluacion.materia} • {evaluacion.tipo_evaluacion}</div>
                                                        </div>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: parseFloat(evaluacion.puntaje_total) >= 10 ? '#15803d' : '#ef4444' }}>
                                                                {parseFloat(evaluacion.puntaje_total).toFixed(1)} / 20
                                                            </div>
                                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                                                {new Date(evaluacion.fecha_evaluacion).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>Aún no tienes evaluaciones calificadas</div>
                                        )}
                                    </div>
                                </div>

                                {/* Próximas Evaluaciones */}
                                <div className="card" style={{ padding: '25px' }}>
                                    <div className="card-header" style={{ marginBottom: '20px' }}>
                                        <h2 className="card-title"><i className="fas fa-calendar-alt"></i> Próximos Eventos</h2>
                                    </div>
                                    <div className="card-content">
                                        {data?.proximasEvaluaciones && data.proximasEvaluaciones.length > 0 ? (
                                            data.proximasEvaluaciones.map((proxima, idx) => (
                                                <div key={idx} className="proxima-eval-item" style={{ display: 'flex', gap: '15px', padding: '15px 0', borderBottom: '1px solid #f1f5f9' }}>
                                                    <div className="calendar-box" style={{ width: '50px', height: '55px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', textAlign: 'center', padding: '5px' }}>
                                                        <div style={{ fontSize: '0.7rem', color: '#ef4444', borderBottom: '1px solid #e2e8f0', paddingBottom: '2px', textTransform: 'uppercase' }}>
                                                            {new Date(proxima.fecha_evaluacion).toLocaleString('es-ES', { month: 'short' })}
                                                        </div>
                                                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1e293b' }}>
                                                            {new Date(proxima.fecha_evaluacion).getDate()}
                                                        </div>
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{proxima.nombre_rubrica}</div>
                                                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{proxima.materia}</div>
                                                        <div style={{ fontSize: '0.8rem', marginTop: '3px' }}>
                                                            <span style={{ color: '#1d4ed8', background: '#eff6ff', padding: '2px 8px', borderRadius: '10px' }}>
                                                                {proxima.tipo_evaluacion}
                                                            </span>
                                                            <span style={{ color: '#94a3b8', marginLeft: '10px' }}>
                                                                Valor: {proxima.porcentaje_evaluacion}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>No hay próximas evaluaciones programadas</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </main>
    )
}