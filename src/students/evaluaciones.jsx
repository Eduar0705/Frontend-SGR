import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Menu from '../components/menu';
import Header from '../components/header';
import { studentEvaluacionesService } from '../services/studentEvaluaciones.service';
import { imprimirRubricaFormal } from '../utils/printRubrica';
import Swal from 'sweetalert2';
import '../assets/css/home.css';

import { useUI } from '../context/UIContext';

export default function StudentEvaluaciones() {
    const navigate = useNavigate();
    const { setLoading: setGlobalLoading } = useUI();
    const [user] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    const [evaluaciones, setEvaluaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [orderBy, setOrderBy] = useState('fecha_fija'); // nuevo estado

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
            setGlobalLoading(false);
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
            console.error(error)
            setSelectedDetail(null);
        } finally {
            setDetailLoading(false);
        }
    };
    const sortedEvaluaciones = useMemo(() => {
        const sorted = [...evaluaciones];
        if (orderBy === 'fecha_fija') {
            sorted.sort((a, b) => new Date(b.fecha_fija) - new Date(a.fecha_fija));
        } else if (orderBy === 'fecha_evaluacion') {
            sorted.sort((a, b) => {
                const dateA = a.fecha_evaluacion ? new Date(a.fecha_evaluacion) : null;
                const dateB = b.fecha_evaluacion ? new Date(b.fecha_evaluacion) : null;
                if (dateA === null && dateB === null) return 0;
                if (dateA === null) return -1;
                if (dateB === null) return 1;
                return dateB - dateA;
            });
        }
        return sorted;
    }, [evaluaciones, orderBy]);

    if (!user) return null;

    return (
        <main className="main-content">
            <Menu user={user} />
            <div className="content-wrapper" style={{ width: '100%' }}>
                <Header title="Mis Evaluaciones" user={user} onLogout={() => navigate('/login')} />

                <div className="view active" style={{ padding: '20px' }}>
                    {/* Título y desplegable */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h1 style={{ color: '#1e293b' }}>Tus Evaluaciones</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <label htmlFor="orderSelect" style={{ fontSize: '14px', color: '#475569' }}>Ordenar por:</label>
                            <div className="filter-group">
                                <select 
                                    class="form-select"
                                    id="orderSelect"
                                    value={orderBy}
                                    onChange={(e) => setOrderBy(e.target.value)}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        border: '1px solid #cbd5e1',
                                        background: '#fff',
                                        fontSize: '14px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="fecha_fija">Fecha de evaluación</option>
                                    <option value="fecha_evaluacion">Fecha de corregido</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>Cargando evaluaciones...</p>
                    ) : evaluaciones.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>No hay evaluaciones disponibles.</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
                            {sortedEvaluaciones.map((ev) => (
                                <div key={ev.evaluacion_id} style={cardStyle}>
                                    <h3 style={{ color: '#1e40af', marginBottom: '12px', fontSize: '1.1rem' }}>{ev.contenido}</h3>
                                    <InfoLine icon="fa-book" label="Materia" value={ev.materia} />
                                    <InfoLine icon="fa-clipboard" label="Tipo" value={ev.tipo_evaluacion || '-'} />
                                    <InfoLine icon="fa-user-tie" label="Profesor" value={ev.profesor} />
                                    <InfoLine icon="fa-percent" label="Ponderación" value={`${ev.porcentaje_evaluacion} pts`} />
                                    <InfoLine icon="fa-star" label="Puntaje Obtenido" value={ev.puntaje_total ? `${parseFloat(ev.puntaje_total).toFixed(2)} pts` : "Pendiente"} />
                                    <InfoLine icon="fa-calendar" label="Fecha" value={new Date(ev.fecha_fija).toLocaleDateString('es-ES')} />
                                    {ev.fecha_evaluacion ? (
                                        <InfoLine icon="fa-calendar" label="Corregido el" value={new Date(ev.fecha_evaluacion).toLocaleDateString('es-ES')} />
                                    ) : (
                                        <InfoLine icon="fa-clock" label="Sin Corregir" value="Pendiente" />
                                    )
                                    }
                                    <button
                                        onClick={() => verDetalles(ev.evaluacion_id)}
                                        style=
                                        {ev.fecha_evaluacion
                                            ? { marginTop: '15px', width: '100%', padding: '10px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }
                                            : { marginTop: '15px', width: '100%', padding: '10px', background: '#bebebe', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }
                                        }
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {selectedDetail.success && (
                                    <button 
                                        type="button"
                                        onClick={() => handleImprimirRubrica(selectedDetail)}
                                        style={{
                                            background: '#10b981',
                                            color: '#fff',
                                            border: 'none',
                                            padding: '8px 16px',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            fontSize: '13px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                        title="Ver Rúbrica Formal / Imprimir"
                                    >
                                        <i className="fas fa-print"></i> Ver Rúbrica
                                    </button>
                                )}
                                <button onClick={() => setSelectedDetail(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666' }}>&times;</button>
                            </div>
                        </div>
                        <div style={{ padding: '25px', overflowY: 'auto', maxHeight: 'calc(85vh - 130px)' }}>
                            {selectedDetail.loading ? (
                                <p style={{ textAlign: 'center', padding: '30px', color: '#666' }}>Cargando detalles...</p>
                            ) : selectedDetail.success ? (
                                <DetailContent data={selectedDetail} onPrint={() => handleImprimirRubrica(selectedDetail)} />
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

// --- Función para imprimir rúbrica formal ---
function handleImprimirRubrica(data) {
    if (!data || !data.rubrica) return;
    const { rubrica, estudiante, evaluacion, criterios } = data;

    const rubricaParaImprimir = {
        nombre_rubrica: rubrica.nombre_rubrica,
        porcentaje_evaluacion: rubrica.porcentaje_evaluacion,
        docente_nombre: rubrica.profesor,
        materia_nombre: rubrica.materia,
        carrera_nombre: estudiante?.carrera,
        seccion_codigo: rubrica.materia_codigo,
        fecha_evaluacion: evaluacion?.fecha_fija || evaluacion?.fecha_evaluacion,
        competencias: rubrica.competencias,
        lapse_academico: ''
    };

    const criteriosParaImprimir = (criterios || []).map(c => ({
        descripcion: c.nombre || c.descripcion,
        puntaje_maximo: c.puntaje_maximo,
        niveles: (c.niveles || []).map(n => ({
            nombre_nivel: n.nombre || n.nombre_nivel,
            descripcion: n.descripcion,
            puntaje: n.puntaje_maximo !== undefined ? n.puntaje_maximo : n.puntaje
        }))
    }));

    const opened = imprimirRubricaFormal(rubricaParaImprimir, criteriosParaImprimir);
    if (!opened) {
        Swal.fire('Atención', 'Por favor habilite las ventanas emergentes (pop-ups) para ver la rúbrica.', 'warning');
    }
}

// --- Función para calcular el nivel de desempeño común promediado ---
function calcularNivelComun(criterios) {
    if (!criterios || criterios.length === 0) return null;

    const seleccionados = [];
    criterios.forEach(c => {
        const sel = c.niveles?.find(n => n.seleccionado);
        if (sel && typeof sel.orden === 'number') {
            seleccionados.push(sel);
        }
    });

    if (seleccionados.length === 0) return null;

    // Promediar los órdenes numéricos y redondear hacia abajo (ej. 3.5 -> 3, 1.33 -> 1)
    const sum = seleccionados.reduce((acc, n) => acc + n.orden, 0);
    const avg = sum / seleccionados.length;
    const targetOrden = Math.max(1, Math.floor(avg));

    // Buscar el nombre correspondiente al targetOrden
    let nombreNivel = null;
    for (const c of criterios) {
        const found = c.niveles?.find(n => n.orden === targetOrden);
        if (found && found.nombre) {
            nombreNivel = found.nombre;
            break;
        }
    }

    if (!nombreNivel) {
        const fallback = { 1: 'Sobresaliente', 2: 'Notable', 3: 'Aprobado', 4: 'Insuficiente' };
        nombreNivel = fallback[targetOrden] || `Nivel ${targetOrden}`;
    }

    return {
        orden: targetOrden,
        nombre: nombreNivel
    };
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

function DetailContent({ data, onPrint }) {
    const { evaluacion, estudiante, rubrica, criterios } = data;
    const nivelComun = calcularNivelComun(criterios);

    return (
        <>
            {/* Resumen Destacado de Resultados */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '25px' }}>
                {/* 1. Puntaje Obtenido */}
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '16px', borderRadius: '10px', textAlign: 'center' }}>
                    <span style={{ display: 'block', color: '#166534', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Puntaje Obtenido
                    </span>
                    <span style={{ fontSize: '1.9rem', fontWeight: 'bold', color: '#15803d' }}>
                        {evaluacion.puntaje_total !== null ? parseFloat(evaluacion.puntaje_total).toFixed(2) : "Pendiente"}
                    </span>
                    <span style={{ display: 'block', fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        de {rubrica.porcentaje_evaluacion} pts
                    </span>
                </div>

                {/* 2. Porcentaje de Evaluación (Destacado) */}
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '16px', borderRadius: '10px', textAlign: 'center' }}>
                    <span style={{ display: 'block', color: '#1e40af', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Ponderación / %
                    </span>
                    <span style={{ fontSize: '1.9rem', fontWeight: 'bold', color: '#2563eb' }}>
                        {rubrica.porcentaje_evaluacion}%
                    </span>
                    <span style={{ display: 'block', fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        Valor en la Materia
                    </span>
                </div>

                {/* 3. Nivel de Desempeño Común */}
                {nivelComun && (
                    <div style={{ 
                        background: nivelComun.orden === 1 ? '#ecfdf5' : nivelComun.orden === 2 ? '#eff6ff' : nivelComun.orden === 3 ? '#fffbeb' : '#fef2f2',
                        border: `1px solid ${nivelComun.orden === 1 ? '#a7f3d0' : nivelComun.orden === 2 ? '#bfdbfe' : nivelComun.orden === 3 ? '#fde68a' : '#fecaca'}`,
                        padding: '16px', 
                        borderRadius: '10px', 
                        textAlign: 'center' 
                    }}>
                        <span style={{ 
                            display: 'block', 
                            color: nivelComun.orden === 1 ? '#065f46' : nivelComun.orden === 2 ? '#1e40af' : nivelComun.orden === 3 ? '#92400e' : '#991b1b',
                            fontSize: '13px', 
                            fontWeight: '600', 
                            textTransform: 'uppercase',
                            marginBottom: '4px' 
                        }}>
                            Nivel de Desempeño
                        </span>
                        <span style={{ 
                            fontSize: '1.4rem', 
                            fontWeight: 'bold', 
                            color: nivelComun.orden === 1 ? '#059669' : nivelComun.orden === 2 ? '#2563eb' : nivelComun.orden === 3 ? '#d97706' : '#dc2626' 
                        }}>
                            {nivelComun.nombre}
                        </span>
                        <span style={{ display: 'block', fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                            Nivel promedio obtenido
                        </span>
                    </div>
                )}
            </div>

            <Section title="Información del Estudiante" icon="fa-user">
                <div style={infoGridStyle}>
                    <p><strong>Nombre:</strong> {estudiante.nombre} {estudiante.apellido}</p>
                    <p><strong>Cédula:</strong> {estudiante.cedula}</p>
                    <p><strong>Email:</strong> {estudiante.email}</p>
                    <p><strong>Carrera:</strong> {estudiante.carrera}</p>
                </div>
            </Section>

            <Section title="Información de la Rúbrica" icon="fa-book">
                <div style={infoGridStyle}>
                    <p><strong>Nombre:</strong> {rubrica.nombre_rubrica}</p>
                    <p><strong>Materia:</strong> {rubrica.materia} ({rubrica.materia_codigo})</p>
                    <p><strong>Tipo:</strong> {rubrica.tipo_evaluacion}</p>
                    <p>
                        <strong>Ponderación:</strong>{' '}
                        <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                            {rubrica.porcentaje_evaluacion}%
                        </span>
                    </p>
                    {rubrica.profesor && <p><strong>Profesor:</strong> {rubrica.profesor}</p>}
                </div>
                {rubrica.instrucciones && <p style={{ marginTop: '8px' }}><strong>Instrucciones:</strong> {rubrica.instrucciones}</p>}
                {rubrica.competencias && <p style={{ marginTop: '4px' }}><strong>Competencias:</strong> {rubrica.competencias}</p>}
            </Section>

            <Section title="Resultados y Observaciones" icon="fa-chart-line">
                <p><strong>Fecha de Evaluación:</strong> {evaluacion.fecha_evaluacion ? new Date(evaluacion.fecha_evaluacion).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</p>
                {evaluacion.observaciones && (
                    <div style={{ background: '#fffbeb', padding: '10px 15px', borderRadius: '6px', marginTop: '10px', borderLeft: '3px solid #f59e0b' }}>
                        <strong>Observaciones del Profesor:</strong>
                        <p style={{ margin: '5px 0 0', color: '#78716c' }}>{evaluacion.observaciones}</p>
                    </div>
                )}
            </Section>

            <Section title="Criterios de Evaluación" icon="fa-clipboard-list">
                {criterios.map((criterio, ci) => (
                    <div key={ci} style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <h4 style={{ margin: 0, color: '#1e293b' }}>{criterio.nombre}</h4>
                            <span style={{ fontSize: '13px', color: '#1e40af', fontWeight: 'bold', background: '#dbeafe', padding: '2px 8px', borderRadius: '6px' }}>
                                Máx: {criterio.puntaje_maximo} pts
                            </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                            {criterio.niveles.map((nivel, ni) => (
                                <div key={ni} style={{
                                    padding: '10px 14px',
                                    borderRadius: '6px',
                                    border: nivel.seleccionado ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                                    background: nivel.seleccionado ? '#eff6ff' : '#fff',
                                    boxShadow: nivel.seleccionado ? '0 1px 3px rgba(59,130,246,0.15)' : 'none',
                                    transition: 'all 0.2s'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        <i className={nivel.seleccionado ? 'fas fa-check-circle' : 'far fa-circle'}
                                            style={{ color: nivel.seleccionado ? '#3b82f6' : '#cbd5e1' }}></i>
                                        <strong style={{ flex: 1, color: nivel.seleccionado ? '#1e40af' : '#334155' }}>{nivel.nombre}</strong>
                                        <span style={{ color: nivel.seleccionado ? '#1e40af' : '#64748b', fontSize: '13px', fontWeight: 'bold' }}>
                                            {nivel.puntaje > nivel.puntaje_maximo
                                                ? `${parseFloat(nivel.puntaje).toFixed(3)} pts`
                                                : `${parseFloat(nivel.puntaje).toFixed(3)}/${parseFloat(nivel.puntaje_maximo).toFixed(3)} pts`}
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b', paddingLeft: '26px' }}>{nivel.descripcion}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </Section>

            {/* Barra de acción al final */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '15px', marginTop: '20px' }}>
                <button
                    type="button"
                    onClick={onPrint}
                    style={{
                        background: '#10b981',
                        color: '#fff',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <i className="fas fa-print"></i> Ver Rúbrica Formal / Imprimir
                </button>
            </div>
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

// --- Estilos (sin cambios) ---
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