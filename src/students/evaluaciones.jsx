import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Menu from '../components/menu';
import Header from '../components/header';
import { studentEvaluacionesService } from '../services/studentEvaluaciones.service';
import Swal from 'sweetalert2';
import '../assets/css/home.css';

export default function StudentEvaluaciones() {
    const navigate = useNavigate();
    const [user] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    const [evaluaciones, setEvaluaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        loadEvaluaciones();
    }, [user, navigate]);

    const loadEvaluaciones = async () => {
        try {
            const data = await studentEvaluacionesService.getEvaluaciones();
            setEvaluaciones(data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const verDetalles = async (evaluacionId) => {
        setDetailLoading(true);
        setSelectedDetail({ loading: true });
        try {
            const data = await studentEvaluacionesService.getDetalleEvaluacion(evaluacionId);
            setSelectedDetail(data);
        } catch (error) {
            Swal.fire('Error', 'No se pudieron cargar los detalles', 'error');
            setSelectedDetail(null);
        } finally {
            setDetailLoading(false);
        }
    };

    if (!user) return null;

    return (
        <main className="main-content">
            <Menu user={user} />
            <div className="content-wrapper" style={{ width: '100%' }}>
                <Header title="Mis Evaluaciones" user={user} onLogout={() => navigate('/login')} />

                <div className="view active" style={{ padding: '20px' }}>
                    <h1 style={{ marginBottom: '20px', color: '#1e293b' }}>Evaluaciones del Estudiante</h1>

                    {loading ? (
                        <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>Cargando evaluaciones...</p>
                    ) : evaluaciones.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>No hay evaluaciones disponibles.</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                            {evaluaciones.map((ev) => (
                                <div key={ev.evaluacion_id} style={cardStyle}>
                                    <h3 style={{ color: '#1e40af', marginBottom: '12px', fontSize: '1.1rem' }}>{ev.nombre_rubrica}</h3>
                                    <InfoLine icon="fa-book" label="Materia" value={ev.materia} />
                                    <InfoLine icon="fa-user-tie" label="Profesor" value={ev.profesor} />
                                    <InfoLine icon="fa-star" label="Puntaje Total" value={`${parseFloat(ev.puntaje_total).toFixed(1)}/100 (${(parseFloat(ev.puntaje_total) / 5).toFixed(1)}/20)`} />
                                    <InfoLine icon="fa-calendar" label="Fecha" value={ev.fecha_evaluacion ? new Date(ev.fecha_evaluacion).toLocaleDateString('es-ES') : 'Pendiente'} />
                                    <InfoLine icon="fa-clipboard" label="Tipo" value={ev.tipo_evaluacion || '-'} />
                                    <InfoLine icon="fa-percent" label="Porcentaje" value={`${ev.porcentaje_evaluacion}%`} />
                                    <button
                                        onClick={() => verDetalles(ev.evaluacion_id)}
                                        style={{ marginTop: '15px', width: '100%', padding: '10px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                    >
                                        <i className="fas fa-eye"></i> Ver Detalles
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Detalle */}
            {selectedDetail && (
                <div style={modalOverlayStyle} onClick={() => setSelectedDetail(null)}>
                    <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 25px', borderBottom: '1px solid #eee' }}>
                            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <i className="fas fa-file-alt" style={{ color: '#3b82f6' }}></i> Detalles de la Evaluación
                            </h2>
                            <button onClick={() => setSelectedDetail(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666' }}>&times;</button>
                        </div>
                        <div style={{ padding: '25px', overflowY: 'auto', maxHeight: 'calc(85vh - 130px)' }}>
                            {selectedDetail.loading ? (
                                <p style={{ textAlign: 'center', padding: '30px', color: '#666' }}>Cargando detalles...</p>
                            ) : selectedDetail.success ? (
                                <DetailContent data={selectedDetail} />
                            ) : selectedDetail.holdup ? (
                                <StatusMessage icon="fa-lightbulb" color="#f59e0b" text="Esta evaluación aún está en curso. ¡Revisa más tarde!" />
                            ) : selectedDetail.no_evaluada ? (
                                <StatusMessage icon="fa-clock" color="#6366f1" text="No has sido evaluado aún. ¡Molesta al profesor!" />
                            ) : (
                                <StatusMessage icon="fa-exclamation-triangle" color="#ef4444" text={`Error: ${selectedDetail.message || 'Por favor, intenta más tarde.'}`} />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

// --- Sub-componentes ---
function InfoLine({ icon, label, value }) {
    return (
        <p style={{ margin: '6px 0', color: '#475569', fontSize: '14px' }}>
            <i className={`fas ${icon}`} style={{ width: '18px', color: '#94a3b8', marginRight: '6px' }}></i>
            <strong>{label}:</strong> {value}
        </p>
    );
}

function StatusMessage({ icon, color, text }) {
    return (
        <div style={{ textAlign: 'center', padding: '50px 20px' }}>
            <i className={`fas ${icon}`} style={{ fontSize: '48px', color, marginBottom: '15px', display: 'block' }}></i>
            <p style={{ fontSize: '16px', color: '#475569' }}>{text}</p>
        </div>
    );
}

function DetailContent({ data }) {
    const { evaluacion, estudiante, rubrica, criterios } = data;
    return (
        <>
            {/* Estudiante */}
            <Section title="Información del Estudiante" icon="fa-user">
                <div style={infoGridStyle}>
                    <p><strong>Nombre:</strong> {estudiante.nombre} {estudiante.apellido}</p>
                    <p><strong>Cédula:</strong> {estudiante.cedula}</p>
                    <p><strong>Email:</strong> {estudiante.email}</p>
                    <p><strong>Carrera:</strong> {estudiante.carrera}</p>
                </div>
            </Section>

            {/* Rúbrica */}
            <Section title="Información de la Rúbrica" icon="fa-book">
                <div style={infoGridStyle}>
                    <p><strong>Nombre:</strong> {rubrica.nombre_rubrica}</p>
                    <p><strong>Materia:</strong> {rubrica.materia} ({rubrica.materia_codigo})</p>
                    <p><strong>Tipo:</strong> {rubrica.tipo_evaluacion}</p>
                    <p><strong>Porcentaje:</strong> {rubrica.porcentaje_evaluacion}%</p>
                </div>
                {rubrica.instrucciones && <p style={{ marginTop: '8px' }}><strong>Instrucciones:</strong> {rubrica.instrucciones}</p>}
                {rubrica.competencias && <p style={{ marginTop: '4px' }}><strong>Competencias:</strong> {rubrica.competencias}</p>}
            </Section>

            {/* Resultados */}
            <Section title="Resultados de la Evaluación" icon="fa-chart-line">
                <div style={{ background: '#f0f9ff', padding: '15px', borderRadius: '8px', textAlign: 'center', marginBottom: '10px' }}>
                    <span style={{ display: 'block', color: '#64748b', fontSize: '13px' }}>Puntaje Total</span>
                    <span style={{ fontSize: '2em', fontWeight: 'bold', color: '#1e40af' }}>{evaluacion.puntaje_total || 'Pendiente'}</span>
                </div>
                <p><strong>Fecha:</strong> {evaluacion.fecha_evaluacion ? new Date(evaluacion.fecha_evaluacion).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</p>
                {evaluacion.observaciones && (
                    <div style={{ background: '#fffbeb', padding: '10px 15px', borderRadius: '6px', marginTop: '10px', borderLeft: '3px solid #f59e0b' }}>
                        <strong>Observaciones:</strong>
                        <p style={{ margin: '5px 0 0', color: '#78716c' }}>{evaluacion.observaciones}</p>
                    </div>
                )}
            </Section>

            {/* Criterios */}
            <Section title="Criterios de Evaluación" icon="fa-clipboard-list">
                {criterios.map((criterio, ci) => (
                    <div key={ci} style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
                        <h4 style={{ margin: '0 0 8px', color: '#1e293b' }}>{criterio.nombre}</h4>
                        <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#64748b' }}>
                            Puntaje Máximo: {criterio.puntaje_maximo} puntos
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {criterio.niveles.map((nivel, ni) => (
                                <div key={ni} style={{
                                    padding: '10px 14px',
                                    borderRadius: '6px',
                                    border: nivel.seleccionado ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                                    background: nivel.seleccionado ? '#eff6ff' : '#fff',
                                    transition: 'all 0.2s'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        <i className={nivel.seleccionado ? 'fas fa-check-circle' : 'far fa-circle'}
                                           style={{ color: nivel.seleccionado ? '#3b82f6' : '#cbd5e1' }}></i>
                                        <strong style={{ flex: 1 }}>{nivel.nombre}</strong>
                                        <span style={{ color: '#3b82f6', fontSize: '13px', fontWeight: 'bold' }}>
                                            {nivel.puntaje >= nivel.puntaje_maximo
                                                ? `${nivel.puntaje} pts`
                                                : `${nivel.puntaje}/${nivel.puntaje_maximo} pts`}
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b', paddingLeft: '26px' }}>{nivel.descripcion}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </Section>
        </>
    );
}

function Section({ title, icon, children }) {
    return (
        <div style={{ marginBottom: '20px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                <i className={`fas ${icon}`} style={{ color: '#3b82f6' }}></i> {title}
            </h3>
            {children}
        </div>
    );
}

// --- Estilos ---
const cardStyle = {
    background: '#fff', borderRadius: '12px', padding: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'transform 0.2s, box-shadow 0.2s',
    border: '1px solid #f1f5f9'
};
const modalOverlayStyle = {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex',
    justifyContent: 'center', alignItems: 'center'
};
const modalContentStyle = {
    background: '#fff', borderRadius: '12px', maxWidth: '800px', width: '95%',
    maxHeight: '90vh', display: 'flex', flexDirection: 'column'
};
const infoGridStyle = {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '8px', fontSize: '14px', color: '#475569'
};
