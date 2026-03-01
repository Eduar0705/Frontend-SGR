import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Menu from '../components/menu';
import Header from '../components/header';
import { calificacionesService } from '../services/calificaciones.service';
import Swal from 'sweetalert2';
import '../assets/css/home.css';

export default function StudentCalificaciones() {
    const navigate = useNavigate();
    const [user] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    const [lapsos, setLapsos] = useState([]);
    const [stats, setStats] = useState({ promedioGeneral: 0, materiasAprobadas: 0, totalMaterias: 0, porcentajeCompletado: 0 });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(0);
    const [selectedMateria, setSelectedMateria] = useState(null);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        loadCalificaciones();
    }, [user, navigate]);

    const loadCalificaciones = async () => {
        try {
            const data = await calificacionesService.getCalificaciones();
            setLapsos(data.lapsos || []);
            setStats(data.stats || { promedioGeneral: 0, materiasAprobadas: 0, totalMaterias: 0, porcentajeCompletado: 0 });
        } catch (error) {
            console.error('Error al cargar calificaciones:', error);
            Swal.fire('Error', 'No se pudieron cargar las calificaciones', 'error');
        } finally {
            setLoading(false);
        }
    };

    const openMateriaDetail = (materia) => {
        setSelectedMateria(materia);
    };

    if (!user) return null;

    return (
        <main className="main-content">
            <Menu user={user} />
            <div className="content-wrapper" style={{ width: '100%' }}>
                <Header title="Mis Calificaciones" user={user} onLogout={() => navigate('/login')} />

                <div className="view active" style={{ padding: '20px' }}>
                    {/* Stats Cards */}
                    <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '25px' }}>
                        <StatCard icon="fa-graduation-cap" color="#10b981" value={stats.promedioGeneral} label="Promedio General" />
                        <StatCard icon="fa-check-circle" color="#3b82f6" value={`${stats.materiasAprobadas}/${stats.totalMaterias}`} label="Materias Aprobadas" />
                        <StatCard icon="fa-chart-line" color="#8b5cf6" value={`${stats.porcentajeCompletado}%`} label="Completado" />
                    </div>

                    {/* Historial Académico */}
                    <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', padding: '25px' }}>
                        <div style={{ marginBottom: '20px', borderBottom: '2px solid #0056b3', paddingBottom: '10px' }}>
                            <h2 style={{ color: '#002e6d', fontSize: '1.5rem', fontWeight: 'bold', fontStyle: 'italic' }}>
                                Historial académico
                            </h2>
                        </div>

                        {loading ? (
                            <p style={{ textAlign: 'center', color: '#666', padding: '30px' }}>Cargando calificaciones...</p>
                        ) : lapsos.length === 0 ? (
                            <p style={{ textAlign: 'center', color: '#666', padding: '30px', fontStyle: 'italic' }}>No hay registros académicos disponibles.</p>
                        ) : (
                            <>
                                {/* Tabs */}
                                <div style={{ display: 'flex', gap: '5px', marginBottom: '20px', borderBottom: '1px solid #ddd' }}>
                                    {lapsos.map((lapso, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setActiveTab(index)}
                                            style={{
                                                padding: '10px 20px',
                                                background: activeTab === index ? '#dc3545' : '#28a745',
                                                color: '#fff',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                                borderRadius: '4px 4px 0 0',
                                                opacity: activeTab === index ? 1 : 0.7,
                                                transition: 'all 0.3s ease'
                                            }}
                                        >
                                            {lapso.nombre}
                                        </button>
                                    ))}
                                </div>

                                {/* Table Content */}
                                {lapsos.map((lapso, index) => (
                                    <div key={index} style={{ display: activeTab === index ? 'block' : 'none' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', fontFamily: "'Segoe UI', sans-serif" }}>
                                            <thead>
                                                <tr>
                                                    <th style={thStyle}>Código</th>
                                                    <th style={{ ...thStyle, width: '40%' }}>Materia</th>
                                                    <th style={thStyle}>UC</th>
                                                    <th style={thStyle}>Nota</th>
                                                    <th style={thStyle}>Nota refer.*</th>
                                                    <th style={thStyle}>% eval.</th>
                                                    <th style={thStyle}>Sección</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {lapso.materias.map((materia, mi) => (
                                                    <tr key={mi}
                                                        onClick={() => openMateriaDetail(materia)}
                                                        style={{ cursor: 'pointer', background: mi % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                                                        <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 'bold' }}>{materia.codigo}</td>
                                                        <td style={{ ...tdStyle, fontWeight: 'bold', textDecoration: 'underline', color: '#002e6d' }}>{materia.nombre}</td>
                                                        <td style={tdCenter}>{materia.uc}</td>
                                                        <td style={{ ...tdCenter, color: '#000080', fontWeight: 'bold' }}>{materia.nota_display}</td>
                                                        <td style={{ ...tdCenter, color: '#000080', fontWeight: 'bold' }}>{materia.nota_referencial}</td>
                                                        <td style={tdCenter}>{materia.porcentaje_acumulado}%</td>
                                                        <td style={tdCenter}>{materia.seccion}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Detalle Materia */}
            {selectedMateria && (
                <div className="modal" style={{ display: 'flex', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 1000, justifyContent: 'center', alignItems: 'center' }} onClick={() => setSelectedMateria(null)}>
                    <div className="modal-content large" style={{ background: '#fff', borderRadius: '12px', maxWidth: '700px', width: '90%', maxHeight: '85vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 25px', borderBottom: '1px solid #eee' }}>
                            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <i className="fas fa-clipboard-check" style={{ color: '#3b82f6' }}></i> Detalle de Evaluación
                            </h2>
                            <button onClick={() => setSelectedMateria(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666' }}>&times;</button>
                        </div>
                        <div style={{ padding: '25px' }}>
                            <h3 style={{ marginBottom: '10px' }}>{selectedMateria.nombre}</h3>
                            <div style={{ display: 'flex', gap: '20px', marginBottom: '15px', color: '#666', fontSize: '14px' }}>
                                <span><i className="fas fa-code"></i> Código: {selectedMateria.codigo}</span>
                                <span><i className="fas fa-layer-group"></i> Sección: {selectedMateria.seccion}</span>
                            </div>
                            <div style={{ background: '#f0f9ff', padding: '15px', borderRadius: '8px', textAlign: 'center', marginBottom: '20px' }}>
                                <span style={{ display: 'block', color: '#64748b', fontSize: '14px', marginBottom: '5px' }}>Calificación Actual</span>
                                <span style={{ fontSize: '2em', fontWeight: 'bold', color: '#1e40af' }}>{selectedMateria.nota_display}/20</span>
                            </div>

                            <h4 style={{ marginBottom: '15px' }}><i className="fas fa-list-alt"></i> Evaluaciones (Rúbricas)</h4>

                            {selectedMateria.rubricas && selectedMateria.rubricas.length > 0 ? (
                                selectedMateria.rubricas.map((rubrica, ri) => {
                                    const puntaje = rubrica.puntaje_obtenido !== null ? parseFloat(rubrica.puntaje_obtenido).toFixed(2) : '-';
                                    const maximo = parseFloat(rubrica.puntaje_maximo).toFixed(2);
                                    const progressWidth = rubrica.puntaje_obtenido !== null && rubrica.puntaje_maximo > 0
                                        ? (rubrica.puntaje_obtenido / rubrica.puntaje_maximo) * 100 : 0;

                                    return (
                                        <div key={ri} style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '12px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <h5 style={{ margin: 0 }}>{rubrica.nombre} <small style={{ color: '#666' }}>({rubrica.porcentaje}%)</small></h5>
                                                <span style={{ fontWeight: 'bold', color: '#1e40af' }}>{puntaje}/{maximo}</span>
                                            </div>
                                            <div style={{ background: '#e2e8f0', borderRadius: '10px', height: '8px', overflow: 'hidden' }}>
                                                <div style={{ background: '#3b82f6', height: '100%', width: `${progressWidth}%`, borderRadius: '10px', transition: 'width 0.5s ease' }}></div>
                                            </div>
                                            {rubrica.observaciones && (
                                                <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#666' }}><strong>Observaciones:</strong> {rubrica.observaciones}</p>
                                            )}
                                            {rubrica.fecha && (
                                                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#999' }}>Fecha: {new Date(rubrica.fecha).toLocaleDateString()}</p>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <p style={{ color: '#666', fontStyle: 'italic' }}>No hay evaluaciones registradas para esta materia.</p>
                            )}
                        </div>
                        <div style={{ padding: '15px 25px', borderTop: '1px solid #eee', textAlign: 'right' }}>
                            <button onClick={() => setSelectedMateria(null)} style={{ padding: '10px 25px', background: '#6b7280', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

// --- Componente auxiliar para las stat cards ---
function StatCard({ icon, color, value, label }) {
    return (
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className={`fas ${icon}`} style={{ fontSize: '22px', color }}></i>
            </div>
            <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>{value}</div>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{label}</div>
            </div>
        </div>
    );
}

// --- Estilos ---
const thStyle = { background: '#fff', color: '#000', fontWeight: 'bold', padding: '10px', textAlign: 'center', border: '1px solid #000' };
const tdStyle = { padding: '8px 12px', border: '1px solid #000', color: '#333' };
const tdCenter = { ...tdStyle, textAlign: 'center' };
