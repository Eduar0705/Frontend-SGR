import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Menu from '../components/menu';
import Header from '../components/header';
import { dashboardService } from '../services/dashboard.service';
import '../assets/css/home.css';

export default function Teacher() {
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
            const stats = await dashboardService.getTeacherStats();
            setData(stats);
        } catch (error) {
            console.error('Error al cargar datos del docente:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!user || !token) {
            navigate('/login');
        } else if (user.id_rol !== 2 && user.id_rol !== 1) {
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
                <Header title="Panel Docente" user={user} onLogout={handleLogout} />
                
                <div className="view active" id="teacher-dashboard" style={{ padding: '30px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '50px' }}>
                            <i className="fas fa-spinner fa-spin fa-2x" style={{ color: '#1e3a8a' }}></i>
                            <p>Cargando panel de control docente...</p>
                        </div>
                    ) : (
                        <>
                            {/* Resumen de estadísticas */}
                            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                                <div className="stat-card card">
                                    <div className="stat-icon primary" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                                        <i className="fas fa-copy"></i>
                                    </div>
                                    <div className="stat-content">
                                        <div className="stat-value" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                            {data?.totalRubricas || 0}
                                        </div>
                                        <div className="stat-label" style={{ color: '#64748b' }}>Rúbricas Propias</div>
                                    </div>
                                </div>
                                <div className="stat-card card">
                                    <div className="stat-icon success" style={{ background: '#f0fdf4', color: '#15803d' }}>
                                        <i className="fas fa-users"></i>
                                    </div>
                                    <div className="stat-content">
                                        <div className="stat-value" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                            {data?.totalEstudiantes || 0}
                                        </div>
                                        <div className="stat-label" style={{ color: '#64748b' }}>Estudiantes a Cargo</div>
                                    </div>
                                </div>
                                <div className="stat-card card">
                                    <div className="stat-icon warning" style={{ background: '#fffbeb', color: '#b45309' }}>
                                        <i className="fas fa-check-double"></i>
                                    </div>
                                    <div className="stat-content">
                                        <div className="stat-value" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                            {data?.totalEvaluaciones || 0}
                                        </div>
                                        <div className="stat-label" style={{ color: '#64748b' }}>Evaluaciones Realizadas</div>
                                    </div>
                                </div>
                            </div>

                            <div className="content-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                                {/* Rúbricas Recientes */}
                                <div className="card" style={{ padding: '25px' }}>
                                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                        <h2 className="card-title"><i className="fas fa-file-signature"></i> Rúbricas Recientes</h2>
                                        <button onClick={() => navigate('/teacher/rubricas')} className="btn-text" style={{ background: 'none', border: 'none', color: '#1d4ed8', cursor: 'pointer' }}>Gestionar</button>
                                    </div>
                                    <div className="card-content">
                                        {data?.rubricasRecientes && data.rubricasRecientes.length > 0 ? (
                                            data.rubricasRecientes.map((rubrica, idx) => (
                                                <div key={idx} className="rubrica-item" style={{ display: 'flex', gap: '15px', padding: '15px 0', borderBottom: '1px solid #f1f5f9' }}>
                                                    <div className="rubrica-icon" style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                                                        <i className="fas fa-file-alt"></i>
                                                    </div>
                                                    <div className="rubrica-info">
                                                        <div className="rubrica-name" style={{ fontWeight: '600' }}>{rubrica.nombre_rubrica}</div>
                                                        <div className="rubrica-meta" style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                                                            Actualizada {calcularTiempoTranscurrido(rubrica.fecha_evaluacion)}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>No has creado rúbricas recientemente</div>
                                        )}
                                    </div>
                                </div>

                                {/* Actividad Reciente */}
                                <div className="card" style={{ padding: '25px' }}>
                                    <div className="card-header" style={{ marginBottom: '20px' }}>
                                        <h2 className="card-title"><i className="fas fa-stream"></i> Últimas Calificaciones</h2>
                                    </div>
                                    <div className="card-content">
                                        {data?.actividadReciente && data.actividadReciente.length > 0 ? (
                                            data.actividadReciente.map((act, idx) => (
                                                <div key={idx} className="activity-item" style={{ display: 'flex', gap: '15px', padding: '15px 0', borderBottom: '1px solid #f1f5f9' }}>
                                                    <div className="activity-initials" style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', fontWeight: 'bold' }}>
                                                        {(act.estudiante_nombre?.charAt(0) + act.estudiante_apellido?.charAt(0)).toUpperCase()}
                                                    </div>
                                                    <div className="activity-content" style={{ flex: 1 }}>
                                                        <div className="activity-text" style={{ fontSize: '0.9rem' }}>
                                                            Evaluaste a <strong>{act.estudiante_nombre} {act.estudiante_apellido}</strong>
                                                        </div>
                                                        <div className="activity-subtext" style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                                            {act.materia_nombre} • {act.nombre_rubrica}
                                                        </div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{act.puntaje_total}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{calcularTiempoTranscurrido(act.fecha_evaluacion)}</div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>No has realizado evaluaciones recientemente</div>
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