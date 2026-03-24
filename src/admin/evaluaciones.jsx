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
import ModalEvaluar from '../teacher/components/ModalEvaluar';
import ModalVerDetalles from '../teacher/components/ModalVerDetalles';

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
    const [seccionesData, setSeccionesData] = useState([]);
    const [evaluacionesPorSeccion, setEvaluacionesPorSeccion] = useState({}); // { id_seccion: evaluaciones[] }
    const [loadingSeccionesDetalle, setLoadingSeccionesDetalle] = useState({}); // { id_seccion: boolean }
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [docenteFilter, setDocenteFilter] = useState('');
    const [estadoFilter, setEstadoFilter] = useState('');

    // Estados de Detalle de Evaluación (Progresivo)
    const [estudiantesPorEvaluacion, setEstudiantesPorEvaluacion] = useState({});
    const [loadingEvaluados, setLoadingEvaluados] = useState({});
    const [showDetalles, setShowDetalles] = useState(false);
    const [selectedEstudianteDetalles, setSelectedEstudianteDetalles] = useState(null);
    const [showEvaluar, setShowEvaluar] = useState(false);
    const [selectedEstudianteEvaluar, setSelectedEstudianteEvaluar] = useState(null);
    const [isActionLoading, setIsActionLoading] = useState(false);



    // Estados del Modal
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [currentEvalId, setCurrentEvalId] = useState(null);
    const [preloadedData, setPreloadedData] = useState(null);
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

    // ── Cargar Secciones Iniciales ─────────────────────────────────────────────
    const loadEvaluaciones = useCallback(async () => {
        try {
            setLoading(true);
            const data = await evaluacionesService.getAllSecciones();
            setSeccionesData(data);
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudieron cargar las secciones', 'error');
        } finally {
            setLoading(false);
            setGlobalLoading(false);
        }
    }, [setGlobalLoading]);

    // ── Cargar Evaluaciones de una Sección bajo demanda ────────────────────────
    const fetchEvaluacionesDeSeccion = async (idSeccion, force = false) => {
        if (!force && (evaluacionesPorSeccion[idSeccion] || loadingSeccionesDetalle[idSeccion])) return;

        try {
            setLoadingSeccionesDetalle(prev => ({ ...prev, [idSeccion]: true }));
            const data = await evaluacionesService.getEvaluacionesBySeccion(idSeccion);
            setEvaluacionesPorSeccion(prev => ({ ...prev, [idSeccion]: data }));
            return data;
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'No se pudieron cargar las evaluaciones de esta sección', 'error');
            return [];
        } finally {
            setLoadingSeccionesDetalle(prev => ({ ...prev, [idSeccion]: false }));
        }
    };

    const fetchEstudiantesDeEvaluacion = async (idEval) => {
        if (loadingEvaluados[idEval]) return;
        try {
            setLoadingEvaluados(prev => ({ ...prev, [idEval]: true }));
            const data = await evaluacionesService.getEvaluadasByEval(idEval);
            setEstudiantesPorEvaluacion(prev => ({ ...prev, [idEval]: data }));
            return data;
        } catch (error) {
            console.error('Error fetching estudiantes:', error);
            Swal.fire('Error', 'No se pudieron cargar los estudiantes de esta evaluación', 'error');
            return [];
        } finally {
            setLoadingEvaluados(prev => ({ ...prev, [idEval]: false }));
        }
    };

    useEffect(() => {
        if (!user) navigate('/login');
        else loadEvaluaciones();
    }, [periodoActual, user, navigate, loadEvaluaciones]);

    // ── Carga de catálogos al abrir modal ──────────────────────────────────────
    useEffect(() => {
        if (showModal) {
            evaluacionesService.getCarrerasByPeriodo().then(res => res.success && setCarreras(res.carreras));
            evaluacionesService.getEstrategias().then(res => res.success && setEstrategias(res.estrategias_eval));
            periodosService.getCortes().then(res => res.success && setCortes(res.cortes));
        }
    }, [showModal]);

    // ── Carga jerárquica ───────────────────────────────────────────────────────
    const handleCarreraChange = async (codigo) => {
        setFormData(prev => ({ ...prev, carrera_codigo: codigo, materia_codigo: '', id_seccion: '', id_horario: '', fecha_horario_json: '', fecha_evaluacion: '' }));
        resetFechas();
        const res = await evaluacionesService.getMateriasByCarreraAndPeriodo(codigo);
        if (res.success) setMaterias(res.materias);
        return res;
    };

    const handleMateriaChange = async (codigo, explicitCarrera = null) => {
        const carrera = explicitCarrera || formData.carrera_codigo;
        setFormData(prev => ({ ...prev, materia_codigo: codigo, id_seccion: '', id_horario: '', fecha_horario_json: '', fecha_evaluacion: '' }));
        resetFechas();
        const res = await evaluacionesService.getSeccionesByMatCarrAndPer(codigo, carrera);
        if (res.success) setSecciones(res.secciones);
        return res;
    };

    const handleSeccionChange = async (id) => {
        setFormData(prev => ({ ...prev, id_seccion: id, id_horario: '', fecha_horario_json: '', fecha_evaluacion: '' }));
        if (id) {
            let evaluationsForSection = evaluacionesPorSeccion[id];
            if (!evaluationsForSection) {
                evaluationsForSection = await fetchEvaluacionesDeSeccion(id);
            }
            await cargarFechas(id, evaluationsForSection || []);
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

    // ── Filtrado de Secciones ────────────────────────────────────────────────
    const filteredSecciones = useMemo(() => {
        return seccionesData.filter(sec => {
            const matchesSearch = !searchTerm ||
                `${sec.materia_nombre} ${sec.docente_nombre} ${sec.docente_apellido}`.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesDocente = !docenteFilter || `${sec.docente_nombre} ${sec.docente_apellido}` === docenteFilter;
            const matchesEstado = !estadoFilter || true; // El estado total de la sección no se tiene fácilmente sin evaluaciones
            return matchesSearch && matchesDocente && matchesEstado;
        });
    }, [seccionesData, searchTerm, docenteFilter, estadoFilter]);

    const docentesUnicos = useMemo(() => {
        const set = new Set(seccionesData.map(sec => `${sec.docente_nombre} ${sec.docente_apellido}`));
        return Array.from(set).sort();
    }, [seccionesData]);

    // ── Agrupación de Secciones (Niveles Jerárquicos) ──────────────────────────
    const seccionesAgrupadas = useMemo(() => {
        const agrupadas = {};
        filteredSecciones.forEach(sec => {
            const c  = sec.carrera_nombre || `Carrera ${sec.carrera_codigo || 'Desconocida'}`;
            const s  = `Semestre ${sec.semestre || 'N/A'}`;
            const m  = sec.materia_nombre || `Materia ${sec.materia_codigo || 'Desconocida'}`;
            const sc = `Sección ${sec.seccion_codigo ? sec.seccion_codigo.slice(-1) : 'N/A'}`;

            if (!agrupadas[c])              agrupadas[c] = {};
            if (!agrupadas[c][s])           agrupadas[c][s] = {};
            if (!agrupadas[c][s][m])        agrupadas[c][s][m] = {};
            // Guardamos el id_seccion para poder pedir sus evaluaciones luego
            agrupadas[c][s][m][sc] = { id: sec.id_seccion, ...sec };
        });
        return agrupadas;
    }, [filteredSecciones]);

    // Estados de expansión por cada nivel
    const [expandedCarreras,  setExpandedCarreras]  = useState({});
    const [expandedSemestres, setExpandedSemestres] = useState({});
    const [expandedMaterias,  setExpandedMaterias]  = useState({});
    const [expandedSecciones, setExpandedSecciones] = useState({});
    const [expandedRubricas,  setExpandedRubricas]  = useState({});

    const tog = (setter) => (key) => setter(prev => ({ ...prev, [key]: !prev[key] }));
    const toggleCarrera  = tog(setExpandedCarreras);
    const toggleSemestre = tog(setExpandedSemestres);
    const toggleMateria  = tog(setExpandedMaterias);
    const toggleSeccion  = (key, idSeccion) => {
        setExpandedSecciones(prev => {
            const newState = !prev[key];
            if (newState && idSeccion) fetchEvaluacionesDeSeccion(idSeccion);
            return { ...prev, [key]: newState };
        });
    };
    const toggleRubrica  = (key, idEval) => {
        setExpandedRubricas(prev => {
            const newState = !prev[key];
            if (newState && idEval) fetchEstudiantesDeEvaluacion(idEval);
            return { ...prev, [key]: newState };
        });
    };


    const Chevron = ({ open }) => (
        <i className={`fas fa-chevron-${open ? 'up' : 'down'}`} style={{ color: '#64748b', fontSize: '0.82em', flexShrink: 0 }} />
    );

    // ── CRUD ───────────────────────────────────────────────────────────────────
    const handleOpenCreate = async (preDataArg = null) => {
        // Ignorar eventos de click si se pasa como primer argumento
        const isEvent = preDataArg && (preDataArg.nativeEvent || preDataArg.target);
        const preData = isEvent ? null : preDataArg;

        setModalMode('create');
        setCurrentEvalId(null);
        setPreloadedData(preData);

        if (preData) {
            setGlobalLoading(true);
            try {
                // Pre-cargar catálogos necesarios para los selects bloqueados
                await handleCarreraChange(preData.carrera_codigo);
                await handleMateriaChange(preData.materia_codigo, preData.carrera_codigo);
                
                setFormData({
                    contenido: '', corte: '', estrategias_eval: [], porcentaje: 5, cant_personas: 1,
                    carrera_codigo: preData.carrera_codigo,
                    materia_codigo: preData.materia_codigo,
                    id_seccion:     preData.id_seccion,
                    tipo_horario: 'Sección',
                    fecha_horario_json: '', fecha_evaluacion: '', id_horario: '', hora_inicio: '', hora_fin: '',
                    competencias: '', instrumentos: ''
                });

                // Cargar fechas disponibles inmediatamente para la sección precargada
                await handleSeccionChange(preData.id_seccion);
                
                setShowModal(true);
            } catch (error) {
                console.error(error);
                Swal.fire('Error', 'No se pudieron precargar los datos', 'error');
            } finally {
                setGlobalLoading(false);
            }
        } else {
            setFormData({
                contenido: '', corte: '', estrategias_eval: [], porcentaje: 5, cant_personas: 1,
                carrera_codigo: '', materia_codigo: '', id_seccion: '', tipo_horario: 'Sección',
                fecha_horario_json: '', fecha_evaluacion: '', id_horario: '', hora_inicio: '', hora_fin: '',
                competencias: '', instrumentos: ''
            });
            resetFechas();
            setShowModal(true);
        }
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
                const evaluationsForSection = evaluacionesPorSeccion[data.id_seccion] || [];
                const evaluacionesSinEstaEdit = evaluationsForSection.filter(e => e.evaluacion_id !== ev.evaluacion_id);
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
                if (formData.id_seccion) {
                    fetchEvaluacionesDeSeccion(formData.id_seccion, true);
                }
            } else {
                Swal.fire('Error', res.message, 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Error al procesar la solicitud', 'error');
        } finally {
            setSubmitting(false);
        }
    };
    const handleDelete = async (e, id) => {
        e.stopPropagation();
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "Esta acción eliminará la evaluación y todas sus calificaciones asociadas.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                setGlobalLoading(true);
                const res = await evaluacionesService.deleteEvaluacion(id);
                if (res.success) {
                    Swal.fire('Eliminado', res.message, 'success');
                    loadEvaluaciones();
                } else {
                    Swal.fire('Error', res.message, 'error');
                }
            } catch (error) {
                console.error(error);
                Swal.fire('Error', 'No se pudo eliminar la evaluación', 'error');
            } finally {
                setGlobalLoading(false);
            }
        }
    };

    const esDiagnostico = estrategias.filter(est => formData.estrategias_eval.includes(est.id))
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
                            <button className="btn-add-premium" onClick={() => handleOpenCreate()}>
                                <i className="fas fa-plus"></i> Agregar Evaluación
                            </button>
                        </div>
                    </div>

                    {/* Acordeón de Evaluaciones */}
                    {loading ? (
                        <div className="loading-state-premium">
                            <div className="spinner"></div>
                            <p>Cargando evaluaciones...</p>
                        </div>
                    ) : Object.keys(seccionesAgrupadas).length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '12px' }}>
                            <i className="fas fa-clipboard-list" style={{ fontSize: '3em', color: '#94a3b8', marginBottom: '15px' }} />
                            <h3>No hay evaluaciones registradas</h3>
                            <p style={{ color: '#64748b' }}>No se encontraron evaluaciones con los filtros actuales.</p>
                        </div>
                    ) : (
                        <div className="hierarchy-container">
                            {Object.keys(seccionesAgrupadas).sort().map(carrera => {
                                const openC = expandedCarreras[carrera];
                                return (
                                    <div key={carrera} style={{ marginBottom: '20px', background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                        {/* NIVEL 1: CARRERA */}
                                        <h2 onClick={() => toggleCarrera(carrera)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', padding: '15px 20px', margin: 0, color: '#1e293b', fontSize: '1.2em' }}>
                                            <span><i className="fas fa-graduation-cap" style={{ marginRight: '10px' }} />{carrera}</span>
                                            <Chevron open={openC} />
                                        </h2>

                                        {openC && (
                                            <div style={{ padding: '20px' }}>
                                                {Object.keys(seccionesAgrupadas[carrera]).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).map(semestre => {
                                                    const sKey = `${carrera}|${semestre}`;
                                                    const openS = expandedSemestres[sKey];
                                                    return (
                                                        <div key={semestre} style={{ marginBottom: '20px' }}>
                                                            {/* NIVEL 2: SEMESTRE */}
                                                            <h3 onClick={() => toggleSemestre(sKey)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '15px' }}>
                                                                <span><i className="fas fa-layer-group" style={{ marginRight: '8px', color: '#64748b' }} />{semestre}</span>
                                                                <Chevron open={openS} />
                                                            </h3>

                                                            {openS && Object.keys(seccionesAgrupadas[carrera][semestre]).sort((a,b) => a.localeCompare(b)).map(materia => {
                                                                const mKey  = `${sKey}|${materia}`;
                                                                const openM = expandedMaterias[mKey];
                                                                return (
                                                                    <div key={materia} style={{ marginLeft: '15px', marginBottom: '15px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                                                        {/* NIVEL 3: MATERIA */}
                                                                        <h4 onClick={() => toggleMateria(mKey)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0, padding: '12px 16px', color: '#1e3a8a', background: '#eef2ff', borderBottom: openM ? '1px solid #c7d2fe' : 'none' }}>
                                                                            <span><i className="fas fa-book" style={{ marginRight: '8px', color: '#3b82f6' }} />{materia}</span>
                                                                            <Chevron open={openM} />
                                                                        </h4>

                                                                        {openM && (
                                                                            <div style={{ padding: '12px 15px', background: '#f8fafc' }}>
                                                                                {Object.keys(seccionesAgrupadas[carrera][semestre][materia]).sort((a,b) => a.localeCompare(b)).map(seccion => {
                                                                                    const secInfo = seccionesAgrupadas[carrera][semestre][materia][seccion];
                                                                                    const scKey = `${mKey}|${seccion}`;
                                                                                    const openSc = expandedSecciones[scKey];
                                                                                    const isLoadingSec = loadingSeccionesDetalle[secInfo.id];
                                                                                    const evaluations = evaluacionesPorSeccion[secInfo.id] || [];

                                                                                    return (
                                                                                        <div key={seccion} style={{ marginBottom: '10px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                                                                            {/* NIVEL 4: SECCIÓN */}
                                                                                            <div onClick={() => toggleSeccion(scKey, secInfo.id)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 16px', background: '#fef9ee', borderBottom: openSc ? '1px solid #fde68a' : 'none', gap: '12px' }}>
                                                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                                                                                    <span style={{ color: '#92400e', fontWeight: 'bold' }}>
                                                                                                        <i className="fas fa-layer-group" style={{ marginRight: '7px', color: '#f59e0b' }} />{seccion}
                                                                                                    </span>
                                                                                                    <span style={{ fontSize: '0.85em', color: '#b45309' }}>
                                                                                                        <i className="fas fa-user-tie" style={{ marginRight: '5px' }} />{secInfo.docente_nombre} {secInfo.docente_apellido}
                                                                                                    </span>
                                                                                                </div>
                                                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                                                    <button
                                                                                                        onClick={(e) => {
                                                                                                            e.stopPropagation();
                                                                                                            handleOpenCreate({
                                                                                                                carrera_codigo: secInfo.carrera_codigo,
                                                                                                                materia_codigo: secInfo.materia_codigo,
                                                                                                                id_seccion:     secInfo.id_seccion
                                                                                                            });
                                                                                                        }}
                                                                                                        style={{
                                                                                                            padding: '5px 12px',
                                                                                                            fontSize: '0.8em',
                                                                                                            background: '#10b981',
                                                                                                            color: 'white',
                                                                                                            border: 'none',
                                                                                                            borderRadius: '6px',
                                                                                                            cursor: 'pointer',
                                                                                                            display: 'flex',
                                                                                                            alignItems: 'center',
                                                                                                            gap: '5px',
                                                                                                            fontWeight: '600'
                                                                                                        }}
                                                                                                        title="Agregar evaluación a esta sección"
                                                                                                    >
                                                                                                        <i className="fas fa-plus" /> Agregar Evaluación
                                                                                                    </button>
                                                                                                    <Chevron open={openSc} />
                                                                                                </div>
                                                                                            </div>

                                                                                            {openSc && (
                                                                                                <div style={{ padding: '12px 15px', background: 'white' }}>
                                                                                                    {isLoadingSec ? (
                                                                                                        <div style={{ textAlign: 'center', padding: '20px' }}>
                                                                                                            <i className="fas fa-spinner fa-spin" style={{ color: '#f59e0b' }} />
                                                                                                            <p style={{ fontSize: '0.9em', color: '#92400e', marginTop: '8px' }}>Cargando detalles...</p>
                                                                                                        </div>
                                                                                                    ) : evaluations.length === 0 ? (
                                                                                                        <div style={{ textAlign: 'center', padding: '30px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #e2e8f0', margin: '10px' }}>
                                                                                                            <i className="fas fa-clipboard-list" style={{ fontSize: '2.5em', color: '#cbd5e1', marginBottom: '15px' }} />
                                                                                                            <h4 style={{ color: '#64748b', margin: '0 0 15px 0' }}>No hay evaluaciones registradas en esta sección</h4>
                                                                                                            <button 
                                                                                                                className="btn-add-premium" 
                                                                                                                style={{ margin: '0 auto' }}
                                                                                                                onClick={() => { 
                                                                                                                    handleOpenCreate({
                                                                                                                        carrera_codigo: secInfo.carrera_codigo,
                                                                                                                        materia_codigo: secInfo.materia_codigo,
                                                                                                                        id_seccion:     secInfo.id_seccion
                                                                                                                    });
                                                                                                                }}
                                                                                                            >
                                                                                                                <i className="fas fa-plus"></i> Agregar Evaluación
                                                                                                            </button>
                                                                                                        </div>
                                                                                                    ) : (
                                                                                                        evaluations.sort((a,b) => {
                                                                                                            const dA = new Date(a.fecha_fija || a.fecha_evaluacion);
                                                                                                            const dB = new Date(b.fecha_fija || b.fecha_evaluacion);
                                                                                                            return dB - dA;
                                                                                                        }).map(ev => {
                                                                                                            const rKey  = `${scKey}|${ev.evaluacion_id}`;
                                                                                                            const openR = expandedRubricas[rKey];
                                                                                                            const fecha_mostrar = ev.fecha_fija || ev.fecha_evaluacion;
                                                                                                            const isLoadingEval = loadingEvaluados[ev.evaluacion_id];
                                                                                                            const evalRecords   = estudiantesPorEvaluacion[ev.evaluacion_id] || [];

                                                                                                            return (
                                                                                                                <div key={ev.evaluacion_id} style={{ marginBottom: '15px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                                                                                                    {/* NIVEL 5: RÚBRICA / EVALUACIÓN (Admin View) */}
                                                                                                                    <div 
                                                                                                                        onClick={() => toggleRubrica(rKey, ev.evaluacion_id)} 
                                                                                                                        style={{ 
                                                                                                                            cursor: 'pointer', 
                                                                                                                            display: 'flex', 
                                                                                                                            justifyContent: 'space-between', 
                                                                                                                            alignItems: 'center', 
                                                                                                                            padding: '12px 18px', 
                                                                                                                            background: ev.rubrica_id ? '#f0fdf4' : '#fffbeb', 
                                                                                                                            borderBottom: openR ? (ev.rubrica_id ? '1px solid #a7f3d0' : '1px solid #fde68a') : 'none' 
                                                                                                                        }}
                                                                                                                    >
                                                                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                                                                                            <div style={{ background: ev.rubrica_id ? '#dcfce7' : '#fff3bf', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                                                                                <i className={ev.rubrica_id ? "fas fa-clipboard-check" : "fas fa-exclamation-triangle"} style={{ color: ev.rubrica_id ? '#10b981' : '#f59e0b' }} />
                                                                                                                            </div>
                                                                                                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                                                                                <span style={{ fontWeight: '600', color: ev.rubrica_id ? '#065f46' : '#92400e', fontSize: '1.05em' }}>{ev.contenido_evaluacion}</span>
                                                                                                                                <span style={{ fontSize: '0.82em', color: ev.rubrica_id ? '#059669' : '#b45309' }}>{ev.rubrica_id ? ev.nombre_rubrica : 'Sin Rúbrica Asociada'} • {ev.valor}%</span>
                                                                                                                            </div>
                                                                                                                        </div>
                                                                                                                        
                                                                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                                                                                                            <span style={{ fontSize: '0.85em', color: ev.rubrica_id ? '#059669' : '#b45309', background: ev.rubrica_id ? 'rgba(5, 150, 105, 0.08)' : 'rgba(180, 83, 9, 0.08)', padding: '4px 10px', borderRadius: '6px', fontWeight: '500' }}>
                                                                                                                                <i className="fas fa-calendar-alt" style={{ marginRight: '6px' }} />
                                                                                                                                {formatearFecha(fecha_mostrar)}
                                                                                                                            </span>
                                                                                                                            
                                                                                                                            <div className="evaluacion-actions" style={{ display: 'flex', gap: '8px' }}>
                                                                                                                               <button className="action-btn-mini view" title="Ver Detalles" onClick={(e) => { e.stopPropagation(); handleOpenView(ev); }}>
                                                                                                                                   <i className="fas fa-eye"></i>
                                                                                                                               </button>
                                                                                                                                <button className="action-btn-mini edit" title="Editar" onClick={(e) => { e.stopPropagation(); handleOpenEdit(ev); }}>
                                                                                                                                    <i className="fas fa-edit"></i>
                                                                                                                                </button>
                                                                                                                                <button className="action-btn-mini delete" title="Eliminar" onClick={(e) => handleDelete(e, ev.evaluacion_id)}>
                                                                                                                                    <i className="fas fa-trash-alt"></i>
                                                                                                                                </button>
                                                                                                                            </div>
                                                                                                                            <Chevron open={openR} />
                                                                                                                        </div>
                                                                                                                    </div>

                                                                                                                    {openR && (
                                                                                                                        <div style={{ padding: '0px', background: 'white' }}>
                                                                                                                            {!ev.rubrica_id ? (
                                                                                                                                <div style={{ textAlign: 'center', padding: '30px 20px', background: '#fff9db', borderRadius: '0 0 12px 12px', border: '1px dashed #fcc419', margin: '15px' }}>
                                                                                                                                    <i className="fas fa-info-circle" style={{ fontSize: '2em', color: '#f59e0b', marginBottom: '15px', display: 'block' }} />
                                                                                                                                    <h4 style={{ margin: '0 0 10px 0', color: '#92400e' }}>Se debe asociar una rúbrica a esta evaluación</h4>
                                                                                                                                    <p style={{ color: '#b45309', fontSize: '0.9em', marginBottom: '20px' }}>No hay una rúbrica asociada para calificar esta evaluación. Por favor, crea una nueva o elige una existente.</p>
                                                                                                                                    <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                                                                                                                                        <button 
                                                                                                                                            onClick={() => navigate('/admin/crear-rubricas', { 
                                                                                                                                                state: { 
                                                                                                                                                    preloaded: {
                                                                                                                                                        carrera: secInfo.carrera_codigo,
                                                                                                                                                        semestre: secInfo.semestre,
                                                                                                                                                        materia_codigo: secInfo.materia_codigo,
                                                                                                                                                        seccion_id: secInfo.id_seccion, // o secInfo.id
                                                                                                                                                        evaluacion_id: ev.evaluacion_id
                                                                                                                                                    }
                                                                                                                                                }
                                                                                                                                            })} 
                                                                                                                                            style={{ padding: '10px 20px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}
                                                                                                                                        >
                                                                                                                                            <i className="fas fa-plus" /> Crear Rúbrica
                                                                                                                                        </button>
                                                                                                                                        <button 
                                                                                                                                            onClick={() => navigate('/admin/rubricas')} 
                                                                                                                                            style={{ padding: '10px 20px', background: 'white', color: '#f59e0b', border: '1px solid #f59e0b', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}
                                                                                                                                        >
                                                                                                                                            <i className="fas fa-sync" /> Seleccionar Existente
                                                                                                                                        </button>
                                                                                                                                    </div>
                                                                                                                                </div>
                                                                                                                            ) : isLoadingEval ? (
                                                                                                                                <div style={{ padding: '30px', textAlign: 'center' }}>
                                                                                                                                    <div className="spinner-mini" style={{ margin: '0 auto 10px' }}></div>
                                                                                                                                    <p style={{ fontSize: '0.9em', color: '#64748b' }}>Cargando estudiantes...</p>
                                                                                                                                </div>
                                                                                                                            ) : evalRecords.length === 0 ? (
                                                                                                                                <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                                                                                                                                    <i className="fas fa-users-slash" style={{ fontSize: '2em', marginBottom: '10px', display: 'block' }}></i>
                                                                                                                                    No hay estudiantes para mostrar.
                                                                                                                                </div>
                                                                                                                             ) : (
                                                                                                                                 <div className="evaluados-list-premium">
                                                                                                                                     {evalRecords.map(record => {
                                                                                                                                         const initials = `${record.estudiante_nombre?.charAt(0) || ''}${record.estudiante_apellido?.charAt(0) || ''}`.toUpperCase();
                                                                                                                                         return (
                                                                                                                                             <div key={record.estudiante_cedula} className="evaluacion-row-premium">
                                                                                                                                                 <div className="row-student-info">
                                                                                                                                                     <div className="row-student-avatar">{initials}</div>
                                                                                                                                                     <div className="row-student-details">
                                                                                                                                                         <span className="row-student-name">{record.estudiante_nombre} {record.estudiante_apellido}</span>
                                                                                                                                                         <span className="row-student-id">CI: {record.estudiante_cedula}</span>
                                                                                                                                                     </div>
                                                                                                                                                 </div>
                                                                                                                                                 <div className="row-status-center">
                                                                                                                                                     <span className={`status-badge-premium ${record.estado === 'Completada' ? 'completada' : 'pendiente'}`}>
                                                                                                                                                         {record.estado}
                                                                                                                                                     </span>
                                                                                                                                                 </div>
                                                                                                                                                 <div className="row-score-section">
                                                                                                                                                     <span className="score-main">{record.puntaje_total || '0.00'}</span>
                                                                                                                                                     <span className="score-label">Nota / 100</span>
                                                                                                                                                 </div>
                                                                                                                                                 <div className="row-actions">
                                                                                                                                                     {record.estado === 'Completada' ? (
                                                                                                                                                         <>
                                                                                                                                                             <button className="btn-row-action eval" onClick={(e) => { e.stopPropagation(); setIsActionLoading(true); setSelectedEstudianteEvaluar({ idEvaluacion: ev.evaluacion_id, cedula: record.estudiante_cedula }); setTimeout(() => { setIsActionLoading(false); setShowEvaluar(true); }, 800); }} title="Editar Evaluacion">
                                                                                                                                                                 <i className="fas fa-edit"></i> <span> Editar </span>
                                                                                                                                                             </button>
                                                                                                                                                             <button className="btn-row-action view" onClick={(e) => { e.stopPropagation(); setIsActionLoading(true); setSelectedEstudianteDetalles({ idEvaluacion: ev.evaluacion_id, cedula: record.estudiante_cedula }); setTimeout(() => { setIsActionLoading(false); setShowDetalles(true); }, 800); }} title="Ver Detalles">
                                                                                                                                                                 <i className="fas fa-eye"></i> <span> Ver</span>
                                                                                                                                                             </button>
                                                                                                                                                         </>
                                                                                                                                                     ) : (
                                                                                                                                                         <button className="btn-row-action eval" onClick={(e) => { e.stopPropagation(); setIsActionLoading(true); setSelectedEstudianteEvaluar({ idEvaluacion: ev.evaluacion_id, cedula: record.estudiante_cedula }); setTimeout(() => { setIsActionLoading(false); setShowEvaluar(true); }, 800); }}>
                                                                                                                                                             <i className="fas fa-clipboard-check"></i> <span> Evaluar</span>
                                                                                                                                                         </button>
                                                                                                                                                     )}
                                                                                                                                                 </div>
                                                                                                                                             </div>
                                                                                                                                         );
                                                                                                                                     })}
                                                                                                                                 </div>
                                                                                                                             )}
                                                                                                                        </div>
                                                                                                                    )}
                                                                                                                </div>
                                                                                                            );
                                                                                                        })
                                                                                                    )}
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>

                {/* ── Modal de Creación/Edición ────────────────────────────── */}
                {showModal && (
                    <div className="modal-premium-overlay">
                        <div className="modal-premium-content">
                            <div className="modal-premium-header">
                                <h2>
                                    {modalMode === 'create' ? 'Agregar Evaluación' :
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
                                                disabled={modalMode === 'view' || !!preloadedData}
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
                                                disabled={!formData.carrera_codigo || modalMode === 'view' || !!preloadedData}
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
                                                disabled={!formData.materia_codigo || modalMode === 'view' || !!preloadedData}
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

                {showEvaluar && selectedEstudianteEvaluar && (
                    <ModalEvaluar
                        data={selectedEstudianteEvaluar}
                        onClose={() => setShowEvaluar(false)}
                        onSaved={() => {
                            setShowEvaluar(false);
                            if (selectedEstudianteEvaluar?.idEvaluacion) {
                                fetchEstudiantesDeEvaluacion(selectedEstudianteEvaluar.idEvaluacion);
                            }
                        }}
                    />
                )}

                {showDetalles && selectedEstudianteDetalles && (
                    <ModalVerDetalles
                        data={selectedEstudianteDetalles}
                        onClose={() => setShowDetalles(false)}
                    />
                )}

                {isActionLoading && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2147483647 }}>
                        <div style={{ background: 'white', padding: '40px 60px', borderRadius: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px', minWidth: '300px' }}>
                            <div className="loader-container-uiverse">
                                <div className="loader"><div className="justify-content-center jimu-primary-loading"></div></div>
                            </div>
                            <div>
                                <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.4em', fontWeight: 'bold' }}>Procesando...</h3>
                                <p style={{ margin: '8px 0 0 0', color: '#64748b', fontSize: '1em' }}>Espere un momento por favor</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
