import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Menu from '../components/menu';
import Header from '../components/header';
import { reportesService } from '../services/reportes.service';
import Swal from 'sweetalert2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import '../assets/css/home.css';

// Registro de componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

import { useUI } from '../context/UIContext';

export default function Reportes() {
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
            const data = await reportesService.getAdminStats();
            setStats(data);
        } catch  {
            Swal.fire('Error', 'No se pudieron cargar las estadísticas', 'error');
        } finally {
            setLoading(false);
            setGlobalLoading(false);
        }
    }, [setGlobalLoading]);

    useEffect(() => {
        if (!user) {
            navigate('/login');
        } else {
            loadStats();
        }
    }, [periodoActual, user, navigate, loadStats]);

    if (!user) return null;

    // Configuración de Colores
    const colors = {
        primary: 'rgba(54, 162, 235, 0.8)',
        success: 'rgba(75, 192, 192, 0.8)',
        warning: 'rgba(255, 206, 86, 0.8)',
        danger: 'rgba(255, 99, 132, 0.8)',
        purple: 'rgba(153, 102, 255, 0.8)',
        orange: 'rgba(255, 159, 64, 0.8)'
    };

    // Datos para Gráficas
    const topRubricasChartData = stats?.topProfesoresPorRubricas ? {
        labels: stats.topProfesoresPorRubricas.map(p => p.nombre_completo),
        datasets: [{
            label: 'Rúbricas Creadas',
            data: stats.topProfesoresPorRubricas.map(p => p.total_rubricas),
            backgroundColor: colors.purple,
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 1
        }]
    } : null;

    const topEvaluacionesChartData = stats?.topProfesoresPorEvaluaciones ? {
        labels: stats.topProfesoresPorEvaluaciones.map(p => p.nombre_completo),
        datasets: [{
            label: 'Evaluaciones Completadas',
            data: stats.topProfesoresPorEvaluaciones.map(p => p.total_evaluaciones),
            backgroundColor: colors.success,
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
        }]
    } : null;

    const actividadMensualData = stats?.actividadMensual ? {
        labels: stats.actividadMensual.map(m => m.mes),
        datasets: [
            {
                label: 'Evaluaciones',
                data: stats.actividadMensual.map(m => m.total_evaluaciones),
                borderColor: colors.primary,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                fill: true,
                tension: 0.4
            },
            {
                label: 'Profesores Activos',
                data: stats.actividadMensual.map(m => m.profesores_activos),
                borderColor: colors.success,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
                tension: 0.4
            }
        ]
    } : null;

    const usoMateriasData = stats?.usoRubricasPorMateria ? {
        labels: stats.usoRubricasPorMateria.map(m => m.materia),
        datasets: [{
            label: 'Rúbricas',
            data: stats.usoRubricasPorMateria.map(m => m.total_rubricas),
            backgroundColor: colors.orange,
            borderColor: 'rgba(255, 159, 64, 1)',
            borderWidth: 1
        }]
    } : null;

    const distribucionNotasData = stats?.distribucionNotas ? {
        labels: stats.distribucionNotas.map(d => d.rango),
        datasets: [{
            data: stats.distribucionNotas.map(d => d.cantidad),
            backgroundColor: [
                colors.success,
                colors.primary,
                colors.warning,
                colors.danger
            ]
        }]
    } : null;

    const rendimientoCarreraData = stats?.rendimientoCarrera ? {
        labels: stats.rendimientoCarrera.map(r => r.nombre),
        datasets: [{
            label: 'Promedio de Calificaciones',
            data: stats.rendimientoCarrera.map(r => r.promedio),
            backgroundColor: colors.primary,
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
        }]
    } : null;

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top'
            }
        }
    };

    const horizontalBarOptions = {
        ...chartOptions,
        indexAxis: 'y',
        plugins: {
            ...chartOptions.plugins,
            legend: { display: false }
        },
        scales: {
            x: {
                beginAtZero: true,
                ticks: { stepSize: 1 }
            }
        }
    };

    return (
        <main className="main-content">
            <Menu user={user} />
            <div className="content-wrapper" style={{ width: '100%' }}>
                <Header title="Reportes y Estadísticas" user={user} onLogout={() => navigate('/login')} />
                
                <div style={{ padding: '30px' }}>
                    <div className="view-header" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '25px' }}>
                        <button className="btns" onClick={() => window.print()} style={{ background: '#1e3a8a', color: 'white', padding: '10px 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <i className="fas fa-download"></i> Exportar Reporte
                        </button>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '100px' }}>
                            <i className="fas fa-spinner fa-spin fa-3x" style={{ color: '#1e3a8a' }}></i>
                            <p style={{ marginTop: '20px', color: '#64748b' }}>Generando reportes estadísticos...</p>
                        </div>
                    ) : stats ? (
                        <>
                            {/* Estadísticas Generales */}
                            <div className="stats-overview" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                                <div className="card" style={{ padding: '25px', textAlign: 'center', borderRadius: '15px' }}>
                                    <div style={{ fontSize: '2.5rem', color: '#3498db', marginBottom: '10px' }}><i className="fas fa-chalkboard-teacher"></i></div>
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalDocentes}</div>
                                    <div style={{ color: '#64748b' }}>Docentes Activos</div>
                                </div>
                                <div className="card" style={{ padding: '25px', textAlign: 'center', borderRadius: '15px' }}>
                                    <div style={{ fontSize: '2.5rem', color: '#9b59b6', marginBottom: '10px' }}><i className="fas fa-table"></i></div>
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalRubricas}</div>
                                    <div style={{ color: '#64748b' }}>Rúbricas Creadas</div>
                                </div>
                                <div className="card" style={{ padding: '25px', textAlign: 'center', borderRadius: '15px' }}>
                                    <div style={{ fontSize: '2.5rem', color: '#e74c3c', marginBottom: '10px' }}><i className="fas fa-clipboard-check"></i></div>
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalEvaluaciones}</div>
                                    <div style={{ color: '#64748b' }}>Evaluaciones Completadas</div>
                                </div>
                            </div>

                            {/* Alertas */}
                            {stats.profesoresInactivos?.length > 0 && (
                                <div className="alert-section danger" style={{ background: '#fef2f2', borderLeft: '5px solid #ef4444', padding: '20px', borderRadius: '10px', marginBottom: '25px' }}>
                                    <h3 style={{ color: '#991b1b', marginTop: 0 }}><i className="fas fa-exclamation-triangle"></i> Profesores Sin Rúbricas ({stats.profesoresInactivos.length})</h3>
                                    <ul style={{ listStyle: 'none', padding: 0, marginTop: '10px' }}>
                                        {stats.profesoresInactivos.slice(0, 5).map((prof, idx) => (
                                            <li key={idx} style={{ padding: '5px 0', borderBottom: '1px solid #fee2e2' }}>
                                                <strong>{prof.nombre_completo}</strong> - {prof.especializacion} {prof.email && `(${prof.email})`}
                                            </li>
                                        ))}
                                        {stats.profesoresInactivos.length > 5 && <li style={{ fontStyle: 'italic', marginTop: '10px' }}>... y {stats.profesoresInactivos.length - 5} más</li>}
                                    </ul>
                                </div>
                            )}

                            {stats.profesoresBajaActividad?.length > 0 && (
                                <div className="alert-section" style={{ background: '#fffbeb', borderLeft: '5px solid #f59e0b', padding: '20px', borderRadius: '10px', marginBottom: '25px' }}>
                                    <h3 style={{ color: '#92400e', marginTop: 0 }}><i className="fas fa-clock"></i> Baja Actividad Reciente ({stats.profesoresBajaActividad.length})</h3>
                                    <ul style={{ listStyle: 'none', padding: 0, marginTop: '10px' }}>
                                        {stats.profesoresBajaActividad.slice(0, 5).map((prof, idx) => (
                                            <li key={idx} style={{ padding: '5px 0', borderBottom: '1px solid #fef3c7' }}>
                                                <strong>{prof.nombre_completo}</strong> - {prof.especializacion} 
                                                <span style={{ marginLeft: '10px', fontSize: '0.85rem' }}>
                                                    {prof.dias_inactivo ? `(Inactivo por ${prof.dias_inactivo} días)` : '(Sin evaluaciones)'}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Gráficas Principales */}
                            <div className="content-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
                                <div className="card" style={{ padding: '25px' }}>
                                    <h3 className="card-title" style={{ marginBottom: '20px' }}><i className="fas fa-trophy" style={{ color: '#fbbf24' }}></i> Top Profesores (Rúbricas)</h3>
                                    <div style={{ height: '350px' }}>
                                        {topRubricasChartData && <Bar data={topRubricasChartData} options={horizontalBarOptions} />}
                                    </div>
                                </div>
                                <div className="card" style={{ padding: '25px' }}>
                                    <h3 className="card-title" style={{ marginBottom: '20px' }}><i className="fas fa-medal" style={{ color: '#94a3b8' }}></i> Top Profesores (Evaluaciones)</h3>
                                    <div style={{ height: '350px' }}>
                                        {topEvaluacionesChartData && <Bar data={topEvaluacionesChartData} options={horizontalBarOptions} />}
                                    </div>
                                </div>
                            </div>

                            <div className="card" style={{ padding: '25px', marginBottom: '30px' }}>
                                <h3 className="card-title" style={{ marginBottom: '20px' }}><i className="fas fa-chart-area"></i> Tendencia de Actividad (Últimos 6 Meses)</h3>
                                <div style={{ height: '400px' }}>
                                    {actividadMensualData && <Line data={actividadMensualData} options={chartOptions} />}
                                </div>
                            </div>

                            <div className="content-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
                                <div className="card" style={{ padding: '25px' }}>
                                    <h3 className="card-title" style={{ marginBottom: '20px' }}>Uso de Rúbricas por Materia</h3>
                                    <div style={{ height: '350px' }}>
                                        {usoMateriasData && <Bar data={usoMateriasData} options={chartOptions} />}
                                    </div>
                                </div>
                                <div className="card" style={{ padding: '25px' }}>
                                    <h3 className="card-title" style={{ marginBottom: '20px' }}>Distribución de Calificaciones</h3>
                                    <div style={{ height: '350px', display: 'flex', justifyContent: 'center' }}>
                                        {distribucionNotasData && <Doughnut data={distribucionNotasData} options={{...chartOptions, maintainAspectRatio: true}} />}
                                    </div>
                                </div>
                            </div>

                            <div className="card" style={{ padding: '25px', marginBottom: '30px' }}>
                                <h3 className="card-title" style={{ marginBottom: '20px' }}><i className="fas fa-tasks"></i> Tasa de Completitud de Evaluaciones</h3>
                                <div className="table-container" style={{ overflowX: 'auto' }}>
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Profesor</th>
                                                <th>Asignadas</th>
                                                <th>Completadas</th>
                                                <th style={{ textAlign: 'center' }}>% Completitud</th>
                                                <th style={{ textAlign: 'center' }}>Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats.tasaCompletitudPorProfesor?.map((prof, idx) => (
                                                <tr key={idx}>
                                                    <td><strong>{prof.nombre_completo}</strong></td>
                                                    <td>{prof.total_asignadas}</td>
                                                    <td>{prof.completadas}</td>
                                                    <td style={{ textAlign: 'center' }}>{prof.porcentaje_completitud}%</td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <span className={`badge ${prof.porcentaje_completitud >= 80 ? 'badge-success' : prof.porcentaje_completitud >= 50 ? 'badge-warning' : 'badge-danger'}`} style={{ padding: '5px 12px', borderRadius: '15px', fontSize: '0.8rem' }}>
                                                            {prof.porcentaje_completitud >= 80 ? 'Excelente' : prof.porcentaje_completitud >= 50 ? 'Regular' : 'Bajo'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="card" style={{ padding: '25px' }}>
                                <h3 className="card-title" style={{ marginBottom: '20px' }}>Rendimiento por Carrera</h3>
                                <div style={{ height: '350px' }}>
                                    {rendimientoCarreraData && <Bar data={rendimientoCarreraData} options={{...chartOptions, scales: { y: { beginAtZero: true, max: 20 }}}} />}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="card" style={{ textAlign: 'center', padding: '50px', border: '1px solid #fee2e2' }}>
                            <i className="fas fa-exclamation-circle fa-3x" style={{ color: '#ef4444' }}></i>
                            <p style={{ marginTop: '20px', fontSize: '1.2rem', color: '#b91c1c' }}>No se pudieron generar los reportes en este momento.</p>
                            <button onClick={loadStats} className="btns" style={{ marginTop: '20px', background: '#3b82f6', color: 'white' }}>Reintentar</button>
                        </div>
                    )}
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    .menu, .btns, .header-user, .view-header { display: none !important; }
                    .main-content { margin: 0 !important; width: 100% !important; }
                    .content-wrapper { padding: 0 !important; }
                    .card { box-shadow: none !important; border: 1px solid #eee !important; break-inside: avoid; }
                    .stats-overview { grid-template-columns: repeat(3, 1fr) !important; }
                    .content-grid { grid-template-columns: 1fr 1fr !important; }
                }
                .badge-success { background: #dcfce7; color: #166534; }
                .badge-warning { background: #fef3c7; color: #92400e; }
                .badge-danger { background: #fef2f2; color: #991b1b; }
            `}} />
        </main>
    );
}