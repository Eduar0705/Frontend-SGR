import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/header';
import Menu from '../components/menu';
import dashboardService from '../services/dashboard.service';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import '../assets/css/home.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function TeacherReportes() {
    const navigate = useNavigate();
    const [user] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    const [stats, setStats] = useState(null);
    const [advancedStats, setAdvancedStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const [basic, advanced] = await Promise.all([
                    dashboardService.getStats(),
                    dashboardService.getAdvancedStats()
                ]);
                setStats(basic);
                setAdvancedStats(advanced);
            } catch (error) {
                console.error('Error loading stats:', error);
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }, []);

    if (!user) return null;
    if (loading) return <div>Cargando reportes...</div>;

    const distribucionData = {
        labels: advancedStats?.distribucionNotas.map(d => d.rango) || [],
        datasets: [{
            label: 'Cantidad de Estudiantes',
            data: advancedStats?.distribucionNotas.map(d => d.cantidad) || [],
            backgroundColor: [
                'rgba(75, 192, 192, 0.6)',
                'rgba(54, 162, 235, 0.6)',
                'rgba(255, 206, 86, 0.6)',
                'rgba(255, 99, 132, 0.6)',
            ],
            borderColor: [
                'rgba(75, 192, 192, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(255, 99, 132, 1)',
            ],
            borderWidth: 1,
        }]
    };

    const rendimientoMateriaData = {
        labels: advancedStats?.rendimientoMateria.map(m => m.nombre) || [],
        datasets: [{
            label: 'Promedio de Notas',
            data: advancedStats?.rendimientoMateria.map(m => parseFloat(m.promedio).toFixed(2)) || [],
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
        }]
    };

    return (
        <main className="main-content">
            <Menu user={user} />
            <div className="content-wrapper" style={{ width: '100%' }}>
                <Header title="Reportes Docentes" user={user} onLogout={() => navigate('/login')} />
                
                <div className="view active" style={{ padding: '20px' }}>
                    <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                        <div className="stat-card" style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e3a8a' }}>{stats?.totalEvaluaciones || 0}</div>
                            <div style={{ color: '#666', fontSize: '14px' }}>Eval. Realizadas</div>
                        </div>
                        <div className="stat-card" style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669' }}>{stats?.totalEstudiantes || 0}</div>
                            <div style={{ color: '#666', fontSize: '14px' }}>Estudiantes a Cargo</div>
                        </div>
                        <div className="stat-card" style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#d97706' }}>{stats?.totalRubricas || 0}</div>
                            <div style={{ color: '#666', fontSize: '14px' }}>Rúbricas Propias</div>
                        </div>
                    </div>

                    <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
                        <div className="card" style={{ background: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ marginBottom: '20px', fontSize: '18px', borderLeft: '4px solid #3b82f6', paddingLeft: '10px' }}>Distribución de Calificaciones</h3>
                            <div style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
                                <Pie data={distribucionData} options={{ maintainAspectRatio: false }} />
                            </div>
                        </div>

                        <div className="card" style={{ background: '#fff', padding: '25px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ marginBottom: '20px', fontSize: '18px', borderLeft: '4px solid #3b82f6', paddingLeft: '10px' }}>Rendimiento por Materia</h3>
                            <div style={{ height: '300px' }}>
                                <Bar data={rendimientoMateriaData} options={{ maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 20 } } }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
