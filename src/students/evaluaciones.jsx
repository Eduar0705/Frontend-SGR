import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Menu from '../components/menu';
import Header from '../components/header';
import { studentEvaluacionesService } from '../services/studentEvaluaciones.service';
import { periodosService } from '../services/periodos.service'; // Asegúrate de que la ruta sea correcta
import { imprimirRubricaFormal } from '../utils/printRubrica';
import Swal from 'sweetalert2';
import '../assets/css/home.css';

import { useUI } from '../context/UIContext';

export default function StudentEvaluaciones() {
    const navigate = useNavigate();
    const location = useLocation();
    const { setLoading: setGlobalLoading } = useUI();
    const [user] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    const [evaluaciones, setEvaluaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDetail, setSelectedDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [orderBy, setOrderBy] = useState('fecha_fija');
    const [periodos, setPeriodos] = useState([]);
    const [periodoActivo, setPeriodoActivo] = useState(null);

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        loadPeriodos();
        loadEvaluaciones(null); // Carga inicial del periodo actual
    }, [user, navigate]);

    // Escuchar evento personalizado de redireccion de notificaciones
    useEffect(() => {
        const handleOpenDirect = (e) => {
            const { evaluacion_id, rubrica_id } = e.detail || {};
            if (evaluacion_id) {
                verDetalles(evaluacion_id);
            } else if (rubrica_id) {
                const found = evaluaciones.find(ev => String(ev.rubrica_id || ev.id_rubrica) === String(rubrica_id));
                if (found) verDetalles(found.evaluacion_id);
            }
        };

        window.addEventListener('open-student-evaluation', handleOpenDirect);
        return () => window.removeEventListener('open-student-evaluation', handleOpenDirect);
    }, [evaluaciones]);

    // Abrir automáticamente el modal de detalles si se pasó state o query params al cargar
    useEffect(() => {
        if (!loading && evaluaciones.length > 0) {
            const targetEvalId = location.state?.evaluacion_id || new URLSearchParams(location.search).get('evaluacion_id');
            const targetRubricaId = location.state?.rubrica_id || new URLSearchParams(location.search).get('rubrica_id');

            if (targetEvalId || targetRubricaId) {
                let foundEval = null;
                if (targetEvalId) {
                    foundEval = evaluaciones.find(e => String(e.evaluacion_id) === String(targetEvalId));
                }
                if (!foundEval && targetRubricaId) {
                    foundEval = evaluaciones.find(e => String(e.rubrica_id || e.id_rubrica) === String(targetRubricaId));
                }

                if (foundEval) {
                    verDetalles(foundEval.evaluacion_id);
                } else if (targetEvalId) {
                    verDetalles(targetEvalId);
                }
            }
        }
    }, [loading, evaluaciones, location.state, location.search]);

    const loadEvaluaciones = async (periodo = null) => {
        try {
            const data = await studentEvaluacionesService.getEvaluaciones(periodo);
            setEvaluaciones(data);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
            setGlobalLoading(false);
        }
    };
    const loadPeriodos = async () => {
    try {
        const result = await periodosService.getPeriodosByEstudiante(); 
        const periodosLista = (result.data || []).map(p => p.codigo || p).filter(Boolean);
        
        console.log('Periodos obtenidos:', periodosLista);
        setPeriodos(periodosLista);
        
        if (periodosLista.length > 0) {
            setPeriodoActivo(periodosLista[0]);
        }
    } catch (error) {
        console.error('Error al cargar periodos:', error);
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

    const verRubricaCard = async (evaluacionId) => {
        try {
            Swal.fire({ title: 'Cargando rúbrica...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            const data = await studentEvaluacionesService.getDetalleEvaluacion(evaluacionId);
            Swal.close();
            if (data && (data.rubrica || data.success)) {
                handleImprimirRubrica(data);
            } else {
                Swal.fire('Atención', data?.message || 'No se encontró la rúbrica para esta evaluación', 'info');
            }
        } catch (error) {
            Swal.close();
            console.error('Error verRubricaCard:', error);
            Swal.fire('Error', 'No se pudo cargar la rúbrica', 'error');
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
                                    <option value="fecha_fija">Fecha fija</option>
                                    <option value="fecha_evaluacion">Fecha de evaluación</option>
                                </select>
                            </div>
                        </div>
                        
                    </div>
                    {periodos.length > 0 && (
                    <div style={{ display: 'flex', gap: '5px', marginBottom: '20px', borderBottom: '1px solid #ddd' }}>
                        {periodos.map((periodo, index) => (
                            <button
                                key={periodo}
                                onClick={() => {
                                    setPeriodoActivo(periodo);
                                    loadEvaluaciones(index === 0 ? null : periodo);
                                }}
                                style={{
                                    padding: '10px 20px',
                                    background: periodoActivo === periodo ? '#dc3545' : '#28a745',
                                    color: '#fff',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    borderRadius: '4px 4px 0 0',
                                    opacity: periodoActivo === periodo ? 1 : 0.7,
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {periodo}
                            </button>
                        ))}
                    </div>
                )}
                    {loading ? (
                        <p style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Cargando evaluaciones...</p>
                    ) : sortedEvaluaciones.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <i className="fas fa-clipboard-list" style={{ fontSize: '48px', color: '#cbd5e1', marginBottom: '15px' }}></i>
                            <p style={{ color: '#64748b', fontSize: '16px' }}>No tienes evaluaciones asignadas.</p>
                        </div>
                    ) : (
                        <div className="cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                            {sortedEvaluaciones.map(ev => (
                                <div key={ev.evaluacion_id} className="card-evaluacion" style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                            <span style={{ fontSize: '12px', fontWeight: 'bold', background: '#e0e7ff', color: '#4338ca', padding: '3px 8px', borderRadius: '6px' }}>
                                                {ev.materia_codigo}
                                            </span>
                                            <span style={{ fontSize: '12px', fontWeight: 'bold', background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '6px' }}>
                                                {ev.porcentaje_evaluacion}%
                                            </span>
                                        </div>
                                        <h3 style={{ margin: '0 0 10px', fontSize: '17px', color: '#1e293b' }}>{ev.contenido_evaluacion || ev.competencias}</h3>
                                        <InfoLine icon="fa-book" label="Evaluación" value={ev.contenido} />
                                        <InfoLine icon="fa-book" label="Materia" value={ev.materia_nombre} />
                                        <InfoLine icon="fa-layer-group" label="Sección" value={`Sección ${ev.seccion_letra}`} />
                                        <InfoLine icon="fa-calendar-alt" label="Fecha Límite" value={ev.fecha_fija ? new Date(ev.fecha_fija).toLocaleDateString('es-ES') : 'Sin fecha'} />
                                    </div>
                                    {ev.fecha_evaluacion ? (
                                        <InfoLine icon="fa-calendar" label="Corregido el" value={new Date(ev.fecha_evaluacion).toLocaleDateString('es-ES')} />
                                    ) : (
                                        <InfoLine icon="fa-clock" label="Sin Corregir" value="Pendiente" />
                                    )
                                    }
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                        <button
                                        type="button"
                                        onClick={() => {
                                            if (ev.rubrica_id) {
                                                verRubricaCard(ev.evaluacion_id);
                                            } else {
                                                Swal.fire('Aviso', 'El profesor no ha adjuntado la rúbrica para esta evaluación.', 'info');
                                            }
                                        }}
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            background: ev.rubrica_id ? '#10b981' : '#94a3b8', // Verde si existe, gris si no
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px',
                                            fontSize: '13px'
                                        }}
                                        title={ev.rubrica_id ? "Ver Rúbrica Formal" : "Rúbrica no disponible"}
                                    >
                                        <i className="fas fa-file-alt"></i> Ver Rúbrica
                                    </button>
                                        <button
                                            type="button"
                                            onClick={() => verDetalles(ev.evaluacion_id)}
                                            style={{
                                                flex: 1,
                                                padding: '10px',
                                                background: ev.fecha_evaluacion ? '#3b82f6' : '#94a3b8',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '6px',
                                                fontSize: '13px'
                                            }}
                                        >
                                            <i className="fas fa-eye"></i> Ver Detalles
                                        </button>
                                    </div>
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
                                {(selectedDetail.rubrica || selectedDetail.criterios || selectedDetail.success) && (
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
                                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                                    <i className="fas fa-lightbulb" style={{ fontSize: '48px', color: '#f59e0b', marginBottom: '15px', display: 'block' }}></i>
                                    <h3 style={{ color: '#1e293b', marginBottom: '8px' }}>Evaluación en Curso</h3>
                                    <p style={{ fontSize: '15px', color: '#64748b', marginBottom: '20px' }}>Esta evaluación aún está en curso. ¡Revisa más tarde!</p>
                                    {(selectedDetail.rubrica || selectedDetail.criterios) && (
                                        <button
                                            type="button"
                                            onClick={() => handleImprimirRubrica(selectedDetail)}
                                            style={{
                                                background: '#10b981',
                                                color: '#fff',
                                                border: 'none',
                                                padding: '10px 24px',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                fontSize: '14px'
                                            }}
                                        >
                                            <i className="fas fa-file-alt"></i> Ver Rúbrica Formal
                                        </button>
                                    )}
                                </div>
                            ) : selectedDetail.no_evaluada ? (
                                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                                    <i className="fas fa-clock" style={{ fontSize: '48px', color: '#6366f1', marginBottom: '15px', display: 'block' }}></i>
                                    <h3 style={{ color: '#1e293b', marginBottom: '8px' }}>No has sido evaluado aún</h3>
                                    <p style={{ fontSize: '15px', color: '#64748b', marginBottom: '20px' }}>Tu profesor aún no ha calificado esta evaluación. Puedes revisar los criterios de la rúbrica formal a continuación.</p>
                                    {(selectedDetail.rubrica || selectedDetail.criterios) && (
                                        <button
                                            type="button"
                                            onClick={() => handleImprimirRubrica(selectedDetail)}
                                            style={{
                                                background: '#10b981',
                                                color: '#fff',
                                                border: 'none',
                                                padding: '10px 24px',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontWeight: 'bold',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                fontSize: '14px'
                                            }}
                                        >
                                            <i className="fas fa-file-alt"></i> Ver Rúbrica Formal
                                        </button>
                                    )}
                                </div>
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

    const sum = seleccionados.reduce((acc, n) => acc + n.orden, 0);
    const avg = sum / seleccionados.length;
    const targetOrden = Math.max(1, Math.floor(avg));

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