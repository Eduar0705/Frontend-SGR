import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Menu from '../components/menu';
import Header from '../components/header';
import dashboardService from '../services/dashboard.service';
import '../assets/css/home.css';
import { useUI } from '../context/UIContext';

export default function Home() {
    const { periodoActual } = useUI();
    const navigate = useNavigate();
    const { setLoading: setGlobalLoading } = useUI();
    const [user] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadStats = useCallback(async () => {
        try {
            setLoading(true);
            const data = await dashboardService.getStats();
            setStats(data);
        } catch (error) {
            console.error('Error al cargar métricas:', error);
        } finally {
            setLoading(false);
            setGlobalLoading(false);
        }
    }, [setGlobalLoading]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!user || !token) {
            navigate('/login');
        } else {
            if (user.id_rol !== 1) {
                navigate('/login');
            } else {
                loadStats();
            }
        }
    }, [periodoActual, navigate, user, loadStats]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/login');
    };

    const calcularTiempoTranscurrido = (fecha) => {
        if (!fecha) return 'hace un momento';
        const ahora = new Date();
        const fechaPasada = new Date(fecha);
        const diferencia = ahora - fechaPasada;

        const segundos = Math.floor(diferencia / 1000);
        const minutos = Math.floor(segundos / 60);
        const horas = Math.floor(minutos / 60);
        const dias = Math.floor(horas / 24);
        const semanas = Math.floor(dias / 7);
        const meses = Math.floor(dias / 30);

        if (meses > 0) return meses === 1 ? 'hace 1 mes' : `hace ${meses} meses`;
        if (semanas > 0) return semanas === 1 ? 'hace 1 semana' : `hace ${semanas} semanas`;
        if (dias > 0) return dias === 1 ? 'hace 1 día' : `hace ${dias} días`;
        if (horas > 0) return horas === 1 ? 'hace 1 hora' : `hace ${horas} horas`;
        if (minutos > 0) return minutos === 1 ? 'hace 1 minuto' : `hace ${minutos} minutos`;
        return 'hace unos segundos';
    };

    if (!user) return null;

    return (
        <main className='main-content'>
            <Menu user={user} />
            <div className="content-wrapper" style={{ width: '100%' }}>
                <Header title="Panel Principal" user={user} onLogout={handleLogout} />
                
                <div className="view active" id="dashboard" style={{ padding: '30px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '50px' }}>
                            <i className="fas fa-spinner fa-spin fa-2x" style={{ color: '#1e3a8a' }}></i>
                            <p>Cargando panel de control...</p>
                        </div>
                    ) : (
                        <>
                            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                                <div className="stat-card card">
                                    <div className="stat-icon primary" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                                        <i className="fas fa-table"></i>
                                    </div>
                                    <div className="stat-content">
                                        <div className="stat-value" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                            {stats?.totalRubricas || 0}
                                        </div>
                                        <div className="stat-label" style={{ color: '#64748b' }}>Rúbricas Activas</div>
                                    </div>
                                </div>
                                <div className="stat-card card">
                                    <div className="stat-icon warning" style={{ background: '#fffbeb', color: '#b45309' }}>
                                        <i className="fas fa-hourglass-half"></i>
                                    </div>
                                    <div className="stat-content">
                                        <div className="stat-value" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                            {stats?.totalEvaluacionesPendientes || 0}
                                        </div>
                                        <div className="stat-label" style={{ color: '#64748b' }}>Evaluaciones Pendientes</div>
                                    </div>
                                </div>
                                <div className="stat-card card">
                                    <div className="stat-icon success" style={{ background: '#f0fdf4', color: '#15803d' }}>
                                        <i className="fas fa-users"></i>
                                    </div>
                                    <div className="stat-content">
                                        <div className="stat-value" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                            {stats?.totalProfesores || 0}
                                        </div>
                                        <div className="stat-label" style={{ color: '#64748b' }}>Docentes Activos</div>
                                    </div>
                                </div>
                            </div>

                            <div className="content-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                                <div className="card" style={{ padding: '25px' }}>
                                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                        <h2 className="card-title"><i className="fas fa-history"></i> Rúbricas Recientes</h2>
                                        <button onClick={() => navigate('/admin/rubricas')} className="btn-text" style={{ background: 'none', border: 'none', color: '#1d4ed8', cursor: 'pointer' }}>Ver todas</button>
                                    </div>
                                    <div className="card-content">
                                        {stats?.rubricasRecientes && stats.rubricasRecientes.length > 0 ? (
                                            stats.rubricasRecientes.map(rubrica => (
                                                <div key={rubrica.id} className="rubrica-item" style={{ display: 'flex', gap: '15px', padding: '15px 0', borderBottom: '1px solid #f1f5f9' }}>
                                                    <div className="rubrica-icon" style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                                                        <i className="fas fa-file-alt"></i>
                                                    </div>
                                                    <div className="rubrica-info">
                                                        <div className="rubrica-name" style={{ fontWeight: '600' }}>{rubrica.nombre}</div>
                                                        <div className="rubrica-meta" style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                                                            {rubrica.materia} • {calcularTiempoTranscurrido(rubrica.fecha)}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>No hay rúbricas recientes</div>
                                        )}
                                    </div>
                                </div>

                                <div className="card" style={{ padding: '25px' }}>
                                    <div className="card-header" style={{ marginBottom: '20px' }}>
                                        <h2 className="card-title"><i className="fas fa-bell"></i> Actividad Reciente</h2>
                                    </div>
                                    <div className="card-content">
                                        {stats?.actividadReciente && stats.actividadReciente.length > 0 ? (
                                            stats.actividadReciente.map(act => (
                                                <div key={act.id} className="activity-item" style={{ display: 'flex', gap: '15px', padding: '15px 0', borderBottom: '1px solid #f1f5f9' }}>
                                                    <div className="activity-icon primary" style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                                                        <i className="fas fa-check-circle"></i>
                                                    </div>
                                                    <div className="activity-content">
                                                        <div className="activity-text" style={{ fontSize: '0.9rem' }}>
                                                            <strong>{act.docente_nombre} {act.docente_apellido}</strong> evaluó a <strong>{act.estudiante_nombre} {act.estudiante_apellido}</strong> en {act.materia_nombre}
                                                        </div>
                                                        <div className="activity-time" style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                                            Puntaje: {act.puntaje_total} • {calcularTiempoTranscurrido(act.fecha)}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>No hay actividad reciente</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </main>
    );
}