import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Menu from '../components/menu';
import Header from '../components/header';
import { evaluacionesService } from '../services/evaluaciones.service';
import { periodosService } from '../services/periodos.service'
import Swal from 'sweetalert2';
import { useUI } from '../context/UIContext';
import { useFechasDisponibles, agruparFechasPorMes } from '../utils/useFechasDisponibles';
import '../assets/css/home.css';
import '../assets/css/evaluacion.css';

const transformDateJSON = (formData) => {
    const fecha_data = JSON.parse(formData.fecha_horario_json)
    formData.id_horario = fecha_data.horarioId
    formData.fecha_evaluacion = fecha_data.fecha
    formData.hora_inicio = fecha_data.horaInicio
    formData.hora_cierre = fecha_data.horaCierre
}
const formatearFecha = (fecha_formato_sql) => {
    const fecha = new Date(fecha_formato_sql);
    const fechaFormateada = fecha.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).replace(/\//g, '-');
    return fechaFormateada;
}

export default function Evaluaciones() {
    const { periodoActual } = useUI();
    const navigate = useNavigate();
    const [user] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    // Estados Principal
    const [evaluaciones, setEvaluaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [docenteFilter, setDocenteFilter] = useState('');
    const [estadoFilter, setEstadoFilter] = useState('');

    const [entriesPerPage, setEntriesPerPage] = useState(6);
    const [currentPage, setCurrentPage] = useState(1);

    // Estados del Modal
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [currentEvalId, setCurrentEvalId] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const { setLoading: setGlobalLoading } = useUI();

    // Catalogos Modal
    const [carreras, setCarreras] = useState([]);
    const [materias, setMaterias] = useState([]);
    const [secciones, setSecciones] = useState([]);
    const [estrategias, setEstrategias] = useState([]);
    const [cortes, setCortes] = useState([]);

    // Hook de fechas dinámicas
    const { fechasSistema, configuracionFechas, loadingFechas, errorFechas, cargarFechas, resetFechas } = useFechasDisponibles();

    const [formData, setFormData] = useState({
        contenido: '',
        corte: '',
        estrategias_eval: [],
        porcentaje: 5,
        cant_personas: 1,
        carrera_codigo: '',
        materia_codigo: '',
        id_seccion: '',
        tipo_horario: 'Sección',
        // Para tipo Sección: guardamos el JSON completo como string (igual que el JS original)
        fecha_horario_json: '',
        // Campos derivados del JSON seleccionado (o ingresados manualmente en tipo Otro)
        fecha_evaluacion: '',
        id_horario: '',
        hora_inicio: '',
        hora_fin: '',
        competencias: '',
        instrumentos: ''
    });

    // ── Cargar Evaluaciones ────────────────────────────────────────────────────
    const loadEvaluaciones = useCallback(async () => {
        try {
            setLoading(true);
            const data = await evaluacionesService.getEvaluaciones();
            setEvaluaciones(data);
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudieron cargar las evaluaciones', 'error');
        } finally {
            setLoading(false);
            setGlobalLoading(false);
        }
    }, [setGlobalLoading]);

    useEffect(() => {
        if (!user) navigate('/login');
        else loadEvaluaciones();
    }, [periodoActual, user, navigate, loadEvaluaciones]);

    // ── Carga de catálogos al abrir modal ──────────────────────────────────────
    useEffect(() => {
        if (showModal) {
            evaluacionesService.getCarreras().then(res => res.success && setCarreras(res.carreras));
            evaluacionesService.getEstrategias().then(res => res.success && setEstrategias(res.estrategias_eval));
            periodosService.getCortes().then(res => res.success && setCortes(res.cortes));
        }
    }, [showModal]);

    // ── Carga jerárquica ───────────────────────────────────────────────────────
    const handleCarreraChange = async (codigo) => {
        setFormData(prev => ({ ...prev, carrera_codigo: codigo, materia_codigo: '', id_seccion: '', id_horario: '', fecha_horario_json: '', fecha_evaluacion: '' }));
        resetFechas();
        const res = await evaluacionesService.getMateriasByCarrera(codigo);
        if (res.success) setMaterias(res.materias);
        return res;
    };

    const handleMateriaChange = async (codigo, explicitCarrera = null) => {
        const carrera = explicitCarrera || formData.carrera_codigo;
        setFormData(prev => ({ ...prev, materia_codigo: codigo, id_seccion: '', id_horario: '', fecha_horario_json: '', fecha_evaluacion: '' }));
        resetFechas();
        const res = await evaluacionesService.getSecciones(codigo, carrera);
        if (res.success) setSecciones(res.secciones);
        return res;
    };

    const handleSeccionChange = async (id) => {
        setFormData(prev => ({ ...prev, id_seccion: id, id_horario: '', fecha_horario_json: '', fecha_evaluacion: '' }));
        if (id) {
            // Cargar fechas disponibles excluyendo las ya ocupadas de esta sección
            await cargarFechas(id, evaluaciones);
        } else {
            resetFechas();
        }
    };

    // ── Cambio en el select de fecha+horario (tipo Sección) ───────────────────
    const handleFechaHorarioChange = (jsonString) => {
        if (!jsonString) {
            setFormData(prev => ({ ...prev, fecha_horario_json: '', id_horario: '', fecha_evaluacion: '', hora_inicio: '', hora_fin: '' }));
            return;
        }
        const selected = JSON.parse(jsonString);
        setFormData(prev => ({
            ...prev,
            fecha_horario_json: jsonString,
            id_horario: selected.horarioId,
            fecha_evaluacion: selected.fecha,
            hora_inicio: selected.horaInicio,
            hora_fin: selected.horaCierre,
        }));
    };

    // ── Cambio de tipo de horario ──────────────────────────────────────────────
    const handleTipoHorarioChange = (tipo) => {
        setFormData(prev => ({
            ...prev,
            tipo_horario: tipo,
            fecha_horario_json: '',
            id_horario: '',
            fecha_evaluacion: '',
            hora_inicio: '',
            hora_fin: '',
        }));
    };

    // ── Filtrado ───────────────────────────────────────────────────────────────
    const filteredEvaluaciones = useMemo(() => {
        return evaluaciones.filter(ev => {
            const matchesSearch = !searchTerm ||
                `${ev.contenido_evaluacion} ${ev.materia_nombre} ${ev.docente_nombre}`.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesDocente = !docenteFilter || `${ev.docente_nombre} ${ev.docente_apellido}` === docenteFilter;
            const matchesEstado = !estadoFilter || ev.estado === estadoFilter;
            return matchesSearch && matchesDocente && matchesEstado;
        });
    }, [evaluaciones, searchTerm, docenteFilter, estadoFilter]);

    const docentesUnicos = useMemo(() => {
        const set = new Set(evaluaciones.map(ev => `${ev.docente_nombre} ${ev.docente_apellido}`));
        return Array.from(set).sort();
    }, [evaluaciones]);

    // ── Paginación ─────────────────────────────────────────────────────────────
    const totalPages = Math.ceil(filteredEvaluaciones.length / entriesPerPage);
    const paginatedEvaluaciones = filteredEvaluaciones.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

    // ── CRUD ───────────────────────────────────────────────────────────────────
    const handleOpenCreate = () => {
        setModalMode('create');
        setCurrentEvalId(null);
        setFormData({
            contenido: '', corte: '', estrategias_eval: [], porcentaje: 5, cant_personas: 1,
            carrera_codigo: '', materia_codigo: '', id_seccion: '', tipo_horario: 'Sección',
            fecha_horario_json: '', fecha_evaluacion: '', id_horario: '', hora_inicio: '', hora_fin: '',
            competencias: '', instrumentos: ''
        });
        resetFechas();
        setShowModal(true);
    };

    const handleOpenEdit = async (ev) => {
        try {
            setGlobalLoading(true);
            const res = await evaluacionesService.getEvaluacionById(ev.evaluacion_id);
            if (res.success) {
                const data = res.evaluacion;
                setModalMode('edit');
                setCurrentEvalId(ev.evaluacion_id);

                // Pre-cargar catálogos
                await handleCarreraChange(data.carrera_codigo);
                await handleMateriaChange(data.materia_codigo, data.carrera_codigo);

                // Cargar fechas disponibles para esta sección
                // (la evaluación que se está editando NO debe bloquearse a sí misma)
                const evaluacionesSinEstaEdit = evaluaciones.filter(e => e.evaluacion_id !== ev.evaluacion_id);
                await cargarFechas(data.id_seccion, evaluacionesSinEstaEdit);

                const fechaStr = data.fecha_evaluacion ? data.fecha_evaluacion.split('T')[0] : '';

                // Reconstruir el JSON de fecha+horario para preseleccionar el select
                let fecha_horario_json = '';
                if (data.tipo_horario === 'Sección' && data.id_horario) {
                    fecha_horario_json = JSON.stringify({
                        fecha: fechaStr,
                        horarioId: data.id_horario,
                        diaNumero: data.dia_num,
                        horaInicio: data.hora_inicio,
                        horaCierre: data.hora_cierre,
                    });
                }

                setFormData({
                    ...data,
                    corte: data.corte || '',
                    cant_personas: data.cantidad_personas || '',
                    contenido: data.contenido || '',
                    estrategias_eval: data.estrategias || [],
                    fecha_evaluacion: fechaStr,
                    fecha_horario_json,
                    hora_inicio: data.hora_inicio || '',
                    hora_fin: data.hora_cierre || '',
                });
                setShowModal(true);
            } else {
                Swal.fire('Error', res.message || 'No se pudo cargar la evaluación', 'error');
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudo cargar el detalle', 'error');
        } finally {
            setGlobalLoading(false);
        }
    };

    const handleOpenView = async (ev) => {
        await handleOpenEdit(ev);
        setModalMode('view');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        if (formData.fecha_horario_json) {
            transformDateJSON(formData)
        }
        try {
            const res = await evaluacionesService.saveEvaluacion(formData, currentEvalId);
            if (res.success) {
                Swal.fire('Éxito', res.message, 'success');
                setShowModal(false);
                loadEvaluaciones();
            } else {
                Swal.fire('Error', res.message, 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Error al procesar la solicitud', 'error');
        } finally {
            setSubmitting(false);
        }
    };
    const esDiagnostico = estrategias
        .filter(est => formData.estrategias_eval.includes(est.id))
        .some(est => est.ponderable === 0);
    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="home-container">
            <Menu user={user} />
            <div className="main-content">
                <Header title="Gestión de Evaluaciones" user={user} onLogout={() => navigate('/')} />

                <main className="view-container">
                    {/* Toolbar Superior */}
                    <div className="toolbar-premium">
                        <div className="search-group">
                            <i className="fas fa-search"></i>
                            <input
                                type="text"
                                placeholder="Buscar evaluación, materia o docente..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="filters-group">
                            <select value={docenteFilter} onChange={(e) => setDocenteFilter(e.target.value)}>
                                <option value="">Todos los Docentes</option>
                                {docentesUnicos.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value)}>
                                <option value="">Todos los Estados</option>
                                <option value="Pendiente">Pendiente</option>
                                <option value="En Progreso">En Progreso</option>
                                <option value="Completada">Completada</option>
                            </select>
                            <button className="btn-add-premium" onClick={handleOpenCreate}>
                                <i className="fas fa-plus"></i> Nueva Evaluación
                            </button>
                        </div>
                    </div>

                    {/* Grid de Evaluaciones */}
                    {loading ? (
                        <div className="loading-state-premium">
                            <div className="spinner"></div>
                            <p>Cargando evaluaciones...</p>
                        </div>
                    ) : (
                        <>
                            <div className="evaluaciones-premium-grid">
                                {paginatedEvaluaciones.map(ev => (
                                    <div key={ev.evaluacion_id} className={`eval-card-premium ${ev.estado.toLowerCase().replace(' ', '-')}`}>
                                        <div className="card-badge">{ev.estado}</div>
                                        <div className="card-header-premium">
                                            <div className="materia-info">
                                                <h3>{ev.materia_nombre}</h3>
                                                <span>{ev.seccion_codigo}</span>
                                            </div>
                                            <div className="docente-info">
                                                <i className="fas fa-user-tie"></i>
                                                <span>{ev.docente_nombre} {ev.docente_apellido}</span>
                                            </div>
                                        </div>
                                        <div className="card-body-premium">
                                            <p className="eval-content">{ev.contenido_evaluacion}</p>
                                            <div className="eval-stats">
                                                <div className="stat-item">
                                                    <label>Ponderación</label>
                                                    <strong>{ev.valor}%</strong>
                                                </div>
                                                <div className="stat-item">
                                                    <label>Progreso</label>
                                                    <strong>{ev.completadas}/{ev.total_evaluaciones}</strong>
                                                </div>
                                            </div>
                                            <div className="eval-footer-info">
                                                <span><i className="fas fa-calendar-alt"></i> {ev.fecha_formateada}</span>
                                                <span><i className="fas fa-clock"></i> {ev.tipo_horario}</span>
                                            </div>
                                        </div>
                                        <div className="card-actions-premium">
                                            <button onClick={() => handleOpenEdit(ev)} title="Editar">
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button onClick={() => handleOpenView(ev)} title="Ver Detalles">
                                                <i className="fas fa-eye"></i>
                                            </button>
                                            <button onClick={() => navigate(`/admin/reportes`)} title="Ver Estadísticas">
                                                <i className="fas fa-chart-bar"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Paginación */}
                            <div className="pagination-premium">
                                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                                    <i className="fas fa-chevron-left"></i>
                                </button>
                                <span>Página {currentPage} de {totalPages}</span>
                                <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)}>
                                    <i className="fas fa-chevron-right"></i>
                                </button>
                            </div>
                        </>
                    )}
                </main>

                {/* ── Modal de Creación/Edición ────────────────────────────── */}
                {showModal && (
                    <div className="modal-premium-overlay">
                        <div className="modal-premium-content">
                            <div className="modal-premium-header">
                                <h2>
                                    {modalMode === 'create' ? 'Nueva Evaluación' :
                                        modalMode === 'edit' ? 'Editar Evaluación' : 'Ver Evaluación'}
                                </h2>
                                <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
                            </div>

                            <form onSubmit={handleSubmit} className="modal-premium-form">

                                {/* ── Sección: Materia ──────────────────────── */}
                                <div className="form-section-premium">
                                    <h4><i className="fas fa-book"></i> Datos de la Materia</h4>
                                    <div className="form-grid-premium">
                                        <div className="form-field">
                                            <label>Carrera</label>
                                            <select
                                                value={formData.carrera_codigo}
                                                onChange={(e) => handleCarreraChange(e.target.value)}
                                                required
                                                disabled={modalMode === 'view'}
                                            >
                                                <option value="">Seleccione...</option>
                                                {carreras.map(c => <option key={c.codigo} value={c.codigo}>{c.nombre}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-field">
                                            <label>Materia</label>
                                            <select
                                                value={formData.materia_codigo}
                                                onChange={(e) => handleMateriaChange(e.target.value)}
                                                disabled={!formData.carrera_codigo || modalMode === 'view'}
                                                required
                                            >
                                                <option value="">Seleccione...</option>
                                                {materias.map(m => (
                                                    <option key={m.codigo} value={m.codigo}>
                                                        {m.nombre} (Semestre {m.semestre})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-field">
                                            <label>Sección</label>
                                            <select
                                                value={formData.id_seccion}
                                                onChange={(e) => handleSeccionChange(e.target.value)}
                                                disabled={!formData.materia_codigo || modalMode === 'view'}
                                                required
                                            >
                                                <option value="">Seleccione...</option>
                                                {secciones.map(s => (
                                                    <option key={s.id} value={s.id}>{s.codigo}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-field">
                                            <label>Corte</label>
                                            <select
                                                value={formData.corte}
                                                disabled={!formData.id_seccion || modalMode == 'view'}
                                                onChange={(e) => setFormData({ ...formData, corte: e.target.value })}
                                                required
                                            >
                                                <option value="">Seleccione el corte...</option>
                                                {cortes.map(c => (
                                                    <option key={c.orden} value={c.orden}>Corte {c.orden} ({formatearFecha(c.fecha_inicio)} - {formatearFecha(c.fecha_fin)})</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Sección: Detalles ─────────────────────── */}
                                <div className="form-section-premium">
                                    <h4><i className="fas fa-tasks"></i> Detalles de la Evaluación</h4>
                                    <div className="form-field full-width">
                                        <label>Contenido / Título</label>
                                        <input
                                            type="text"
                                            value={formData.contenido}
                                            onChange={(e) => setFormData({ ...formData, contenido: e.target.value })}
                                            required
                                            disabled={modalMode === 'view'}
                                        />
                                    </div>
                                    <div className="form-grid-premium">
                                        <div className="form-field">
                                            <label>Ponderación (%)</label>
                                            <input
                                                type="number" min="1" max="100"
                                                value={formData.porcentaje}
                                                onChange={(e) => setFormData({ ...formData, porcentaje: e.target.value })}
                                                required
                                                disabled={modalMode === 'view' || esDiagnostico}
                                            />
                                        </div>
                                        <div className="form-field">
                                            <label>Cantidad de personas</label>
                                            <input
                                                type="number" min="1" max="50"
                                                placeholder="Cantidad de personas en caso de ser grupal"
                                                value={formData.cant_personas}
                                                onChange={(e) => setFormData({ ...formData, cant_personas: e.target.value })}
                                                disabled={modalMode === 'view'}
                                            >
                                            </input>
                                        </div>
                                    </div>
                                </div>

                                {/* ── Sección: Horario ──────────────────────── */}
                                <div className="form-section-premium">
                                    <h4><i className="fas fa-clock"></i> Horario</h4>
                                    <div className="form-grid-premium">
                                        <div className="form-field">
                                            <label>Tipo de Horario</label>
                                            <select
                                                value={formData.tipo_horario}
                                                onChange={(e) => handleTipoHorarioChange(e.target.value)}
                                                disabled={!formData.id_seccion || modalMode === 'view'}
                                            >
                                                <option value="Sección">Dentro de Horario de Sección</option>
                                                <option value="Otro">Fuera de Horario</option>
                                            </select>
                                        </div>

                                        {formData.tipo_horario === 'Sección' ? (
                                            <div className="form-field">
                                                <label>
                                                    Fecha y Horario Disponible
                                                    {loadingFechas && <span style={{ marginLeft: 8, fontSize: '0.8em', color: '#888' }}>Cargando...</span>}
                                                </label>
                                                {errorFechas ? (
                                                    <p style={{ color: 'red', fontSize: '0.85em' }}>{errorFechas}</p>
                                                ) : (
                                                    <select
                                                        value={formData.fecha_horario_json}
                                                        onChange={(e) => handleFechaHorarioChange(e.target.value)}
                                                        disabled={!formData.id_seccion || loadingFechas || modalMode === 'view'}
                                                        required
                                                    >
                                                        <option value="">
                                                            {loadingFechas ? 'Cargando fechas...' : '-- Seleccione una fecha --'}
                                                        </option>
                                                        {!loadingFechas && fechasSistema.length === 0 && (
                                                            <option disabled>No hay fechas disponibles en este período</option>
                                                        )}
                                                        {!loadingFechas && Object.entries(agruparFechasPorMes(fechasSistema)).map(([mes, fechas]) => (
                                                            <optgroup key={mes} label={mes}>
                                                                {fechas.map(f => {
                                                                    const optionData = JSON.stringify({
                                                                        fecha: f.fechaStr,
                                                                        horarioId: f.horarioId,
                                                                        diaNumero: f.diaNumero,
                                                                        horaInicio: f.horaInicio,
                                                                        horaCierre: f.horaCierre,
                                                                    });
                                                                    return (
                                                                        <option key={`${f.fechaStr}_${f.horarioId}`} value={optionData}>
                                                                            {f.fechaLocal} ({f.diaSemana}) — {f.horaInicio?.substring(0, 5)} a {f.horaCierre?.substring(0, 5)} — Aula: {f.aula}
                                                                        </option>
                                                                    );
                                                                })}
                                                            </optgroup>
                                                        ))}
                                                    </select>
                                                )}
                                                {/* Info del período académico */}
                                                {configuracionFechas && (
                                                    <small style={{ color: '#888', marginTop: 4, display: 'block' }}>
                                                        <i className="fas fa-info-circle"></i> Período: {configuracionFechas.periodo} &nbsp;|&nbsp;
                                                        Solo se muestran los horarios de clase de la sección
                                                    </small>
                                                )}
                                            </div>
                                        ) : (
                                            <>
                                                <div className="form-field">
                                                    <label>Fecha</label>
                                                    <input
                                                        type="date"
                                                        value={formData.fecha_evaluacion}
                                                        min={configuracionFechas?.fechaInicio?.slice(0, 10)}
                                                        max={configuracionFechas?.fechaFin?.slice(0, 10)}
                                                        onChange={(e) => setFormData({ ...formData, fecha_evaluacion: e.target.value })}
                                                        required
                                                        disabled={modalMode === 'view'}
                                                    />
                                                </div>
                                                <div className="form-field">
                                                    <label>Hora Inicio</label>
                                                    <input
                                                        type="time"
                                                        value={formData.hora_inicio}
                                                        max={formData.hora_fin || undefined}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            setFormData({
                                                                ...formData,
                                                                hora_inicio: value,
                                                                // Si la nueva hora inicio es mayor que fin, limpiar fin
                                                                hora_fin: formData.hora_fin && value >= formData.hora_fin ? '' : formData.hora_fin
                                                            });
                                                        }}
                                                        required
                                                        disabled={modalMode === 'view'}
                                                    />
                                                </div>
                                                <div className="form-field">
                                                    <label>Hora Fin</label>
                                                    <input
                                                        type="time"
                                                        value={formData.hora_fin}
                                                        min={formData.hora_inicio || undefined}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            setFormData({
                                                                ...formData,
                                                                hora_fin: value,
                                                                // Si la nueva hora fin es menor que inicio, limpiar inicio
                                                                hora_inicio: formData.hora_inicio && value <= formData.hora_inicio ? '' : formData.hora_inicio
                                                            });
                                                        }}
                                                        required
                                                        disabled={modalMode === 'view'}
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* ── Sección: Estrategias ──────────────────── */}
                                <div className="form-section-premium">
                                    <h4><i className="fas fa-list-ul"></i> Estrategias, Competencias e Instrumentos</h4>
                                    <div className="form-field full-width">
                                        <label>Estrategias (Selección Múltiple)</label>
                                        <div className="chips-container-premium">
                                            {estrategias.map(est => (
                                                <label key={est.id} className={`chip-premium ${formData.estrategias_eval.includes(est.id) ? 'selected' : ''}`}>
                                                    <input
                                                        type="checkbox"
                                                        value={est.id}
                                                        checked={formData.estrategias_eval.includes(est.id)}
                                                        disabled={modalMode === 'view'}
                                                        onChange={(e) => {
                                                            const id = parseInt(e.target.value);
                                                            const newEst = e.target.checked
                                                                ? [...formData.estrategias_eval, id]
                                                                : formData.estrategias_eval.filter(x => x !== id);

                                                            // Verificar si alguna estrategia seleccionada es no ponderable
                                                            const tieneNoPonderable = estrategias
                                                                .filter(est => newEst.includes(est.id))
                                                                .some(est => est.ponderable === 0);

                                                            const porcentaje = tieneNoPonderable
                                                                ? 0
                                                                : (esDiagnostico ? 5 : formData.porcentaje); // si venía bloqueado, restaurar a 5

                                                            setFormData({ ...formData, estrategias_eval: newEst, porcentaje });
                                                        }}
                                                    />
                                                    {est.nombre}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="form-grid-premium">
                                        <div className="form-field">
                                            <label>Competencias</label>
                                            <textarea
                                                rows="3"
                                                value={formData.competencias}
                                                onChange={(e) => setFormData({ ...formData, competencias: e.target.value })}
                                                placeholder="Describa las competencias..."
                                                disabled={modalMode === 'view'}
                                            />
                                        </div>
                                        <div className="form-field">
                                            <label>Instrumentos</label>
                                            <textarea
                                                rows="3"
                                                value={formData.instrumentos}
                                                onChange={(e) => setFormData({ ...formData, instrumentos: e.target.value })}
                                                placeholder="Describa los instrumentos..."
                                                disabled={modalMode === 'view'}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-premium-footer">
                                    <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                                        {modalMode === 'view' ? 'Cerrar' : 'Cancelar'}
                                    </button>
                                    {modalMode !== 'view' && (
                                        <button type="submit" className="btn-save" disabled={submitting}>
                                            {submitting ? 'Guardando...' : (modalMode === 'create' ? 'Crear Evaluación' : 'Guardar Cambios')}
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
