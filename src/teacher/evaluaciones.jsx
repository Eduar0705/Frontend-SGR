import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/header';
import Menu from '../components/menu';
import Swal from 'sweetalert2';
import { evaluacionesService } from '../services/evaluaciones.service';
import { periodosService } from '../services/periodos.service';
import '../assets/css/evaluacion.css';

import ModalEvaluar from './components/ModalEvaluar';
import ModalVerDetalles from './components/ModalVerDetalles';
import ModalAddEvaluacion from './components/ModalAddEvaluacion';

import { useUI } from '../context/UIContext';

export default function TeacherEvaluaciones() {
    const navigate = useNavigate();
    const { setLoading: setGlobalLoading } = useUI();
    const [user] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    const [evaluacionesAgrupadas, setEvaluacionesAgrupadas] = useState({});
    const [estudiantesPorEvaluacion, setEstudiantesPorEvaluacion] = useState({}); // { id_evaluacion: estudiantes[] }
    const [loadingEvaluados, setLoadingEvaluados] = useState({}); // { id_evaluacion: boolean }
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Un estado de expansión por nivel jerárquico
    const [expandedCarreras,  setExpandedCarreras]  = useState({});
    const [expandedSemestres, setExpandedSemestres] = useState({});
    const [expandedMaterias,  setExpandedMaterias]  = useState({});
    const [expandedSecciones, setExpandedSecciones] = useState({});
    const [expandedRubricas,  setExpandedRubricas]  = useState({});

    const [isActionLoading, setIsActionLoading] = useState(false);

    const [showEvaluar,               setShowEvaluar]               = useState(false);
    const [selectedEstudianteEvaluar, setSelectedEstudianteEvaluar] = useState(null);
    const [showDetalles,              setShowDetalles]              = useState(false);
    const [selectedEstudianteDetalles,setSelectedEstudianteDetalles]= useState(null);

    // Modal para agregar/editar/ver evaluación
    const [showAddModal, setShowAddModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
    const [selectedEvalId, setSelectedEvalId] = useState(null);
    const [preloadedData, setPreloadedData] = useState(null);
    const [cortesPeriodo, setCortesPeriodo] = useState([]);

    const hasAvailableCortes = React.useMemo(() => {
        const now = new Date('2025-10-10'); // FECHA PERSONALIZADA
        now.setHours(0, 0, 0, 0);
        return cortesPeriodo.some(c => new Date(c.fecha_fin) >= now);
    }, [cortesPeriodo]);

    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        fetchEvaluaciones();
    }, [user, navigate]);

    const formatearFecha = (fecha_formato_sql) => {
        if (!fecha_formato_sql) return 'N/A';
        const fecha = new Date(fecha_formato_sql); // FECHA PERSONALIZADA
        const fechaFormateada = fecha.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).replace(/\//g, '-');
        return fechaFormateada;
    }

    const fetchEvaluaciones = async () => {
        setLoading(true);
        try {
            const [evals, resCortes, resLapsos] = await Promise.all([
                evaluacionesService.getTeacherEvaluaciones(),
                periodosService.getCortesByPeriodo('2025-1'), //FECHA PERSONALIZADA
                periodosService.getLapsosByPeriodo('2025-1') //FECHA PERSONALIZADA
            ]);

            if (resCortes.success) {
                console.log(resCortes.data)
                setCortesPeriodo(resCortes.data.cortes);
            }

            setEstudiantesPorEvaluacion({});
            setLoadingEvaluados({});
            agruparEvaluaciones(
                evals, 
                resCortes.success ? resCortes.data.cortes : [],
                resLapsos.success ? resLapsos.data : []
            );
        } catch (error) {
            console.error('Error fetching data:', error);
            Swal.fire('Error', 'No se pudieron cargar los datos', 'error');
        } finally {
            setLoading(false);
            setGlobalLoading(false);
        }
    };

    const fetchEstudiantesDeEvaluacion = async (idEval, force = false) => {
        if (!force && (estudiantesPorEvaluacion[idEval] || loadingEvaluados[idEval])) return;

        setLoadingEvaluados(prev => ({ ...prev, [idEval]: true }));
        try {
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

    const agruparEvaluaciones = (lista, cortes = [], lapsos = []) => {
        const agrupadas = {};
        const now = new Date('2025-10-10'); //FECHA PERSONALIZADA

        lista.forEach(ev => {
            // Normalizar nombres de campos
            ev.carrera_codigo = ev.carrera_codigo || ev.codigo_carrera;
            ev.materia_codigo = ev.materia_codigo || ev.codigo_materia;

            const c  = ev.carrera_nombre;
            const s  = `Semestre ${ev.materia_semestre}`;
            const m  = ev.materia_nombre;
            const sc = `Sección ${ev.seccion_codigo}`;
            const r  = `${ev.contenido} (${ev.nombre_rubrica})`;

            // Pre-calcular canModify (entidad evaluacion)
            let canModify = false;
            let canEvaluate = false;

            if (cortes && cortes.length > 0) {
                const matchingCorte = cortes.find(ct => ct.orden === ev.corte);
                if (matchingCorte) {
                    const start = new Date(matchingCorte.fecha_inicio);
                    const end = new Date(matchingCorte.fecha_fin);
                    
                    // Lógica para canModify
                    if (now < start) {
                        canModify = true;
                    } else if (now >= start && now <= end) {
                        canModify = ev.existe_evaluado === 0;
                    }

                    // Lógica para canEvaluate (Condicion 1: dentro del corte)
                    if (now >= start && now <= end) {
                        canEvaluate = true;
                    }
                }
            }

            // Lógica para canEvaluate (Condicion 2: dentro de cualquier lapso de correciones)
            if (!canEvaluate && lapsos && lapsos.length > 0) {
                canEvaluate = lapsos.some(lp => {
                    const lStart = new Date(lp.fecha_inicio);
                    const lEnd   = new Date(lp.fecha_fin);
                    return now >= lStart && now <= lEnd;
                });
            }

            ev.canModify = canModify;
            ev.canEvaluate = canEvaluate;

            if (!agrupadas[c])              agrupadas[c] = {};
            if (!agrupadas[c][s])           agrupadas[c][s] = {};
            if (!agrupadas[c][s][m])        agrupadas[c][s][m] = {};
            if (!agrupadas[c][s][m][sc])    agrupadas[c][s][m][sc] = { 
                info: { 
                    horario: ev.seccion_horario, 
                    aula: ev.seccion_aula,
                    carrera_codigo: ev.carrera_codigo || ev.codigo_carrera,
                    materia_codigo: ev.materia_codigo || ev.codigo_materia,
                    id_seccion: ev.id_seccion 
                }, 
                rubricas: {} 
            };
            
            if (ev.id_evaluacion) {
                agrupadas[c][s][m][sc].rubricas[r] = ev;
            }
        });

        setEvaluacionesAgrupadas(agrupadas);

        // Expandir todos los árboles hasta la capa de secciones
        const newCarreras = {};
        const newSem = {};
        const newM = {};

        Object.keys(agrupadas).forEach(carrera => {
            newCarreras[carrera] = true;
            Object.keys(agrupadas[carrera]).forEach(sem => {
                const semKey = `${carrera}|${sem}`;
                newSem[semKey] = true;
                Object.keys(agrupadas[carrera][sem]).forEach(mat => {
                    const mKey = `${carrera}|${sem}|${mat}`;
                    newM[mKey] = true;
                });
            });
        });

        setExpandedCarreras(newCarreras);
        setExpandedSemestres(newSem);
        setExpandedMaterias(newM);
        setExpandedSecciones({});
        setExpandedRubricas({});
    };

    // Handlers para el modal de evaluación
    const handleOpenEdit = (e, id) => {
        e.stopPropagation();
        setSelectedEvalId(id);
        setModalMode('edit');
        setShowAddModal(true);
    };

    const handleOpenView = (e, id) => {
        e.stopPropagation();
        setSelectedEvalId(id);
        setModalMode('view');
        setShowAddModal(true);
    };

    const handleDelete = (e, id) => {
        e.stopPropagation();
        Swal.fire({
            title: '¿Eliminar Evaluación?',
            text: "Esta acción eliminará permanentemente la evaluación y todos los registros asociados. No se puede deshacer.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await evaluacionesService.deleteEvaluacion(id);
                    if (res.success) {
                        Swal.fire('Eliminado', 'La evaluación ha sido eliminada con éxito.', 'success');
                        fetchEvaluaciones();
                    } else {
                        Swal.fire('Error', res.message || 'No se pudo eliminar la evaluación', 'error');
                    }
                } catch (err) {
                    console.error('Error deleting evaluation:', err);
                    Swal.fire('Error', 'Hubo un error al conectar con el servidor', 'error');
                }
            }
        });
    };

    // Helper genérico para toggles
    const tog = (setter) => (key) => setter(prev => ({ ...prev, [key]: !prev[key] }));
    const toggleCarrera  = tog(setExpandedCarreras);
    const toggleSemestre = tog(setExpandedSemestres);
    const toggleMateria  = tog(setExpandedMaterias);
    const toggleSeccion  = tog(setExpandedSecciones);
    const toggleRubrica  = (key, idEval, hasRubrica = true) => {
        setExpandedRubricas(prev => {
            const newState = !prev[key];
            if (newState && idEval && hasRubrica) fetchEstudiantesDeEvaluacion(idEval);
            return { ...prev, [key]: newState };
        });
    };

    // Chevron reutilizable
    const Chevron = ({ open }) => (
        <i className={`fas fa-chevron-${open ? 'up' : 'down'}`} style={{ color: '#64748b', fontSize: '0.82em', flexShrink: 0 }} />
    );

    /* ─────────── render ─────────── */
    const renderContent = () => {
        if (loading) return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <i className="fas fa-spinner fa-spin fa-3x" style={{ color: '#3b82f6' }} />
                <p style={{ marginTop: '10px', color: '#64748b' }}>Cargando evaluaciones...</p>
            </div>
        );

        if (Object.keys(evaluacionesAgrupadas).length === 0) return (
            <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '12px' }}>
                <i className="fas fa-clipboard-list" style={{ fontSize: '3em', color: '#94a3b8', marginBottom: '15px' }} />
                <h3>No hay evaluaciones registradas</h3>
                <p style={{ color: '#64748b' }}>Aún no se han asignado evaluaciones a los estudiantes.</p>
            </div>
        );

        return (
            <div className="hierarchy-container">
                {Object.keys(evaluacionesAgrupadas).map(carrera => {
                    const openC = expandedCarreras[carrera];
                    return (
                        <div key={carrera} style={{ marginBottom: '20px', background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>

                            {/* ══ NIVEL 1: CARRERA ══ */}
                            <h2 onClick={() => toggleCarrera(carrera)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', padding: '15px 20px', margin: 0, color: '#1e293b', fontSize: '1.2em' }}>
                                <span><i className="fas fa-graduation-cap" style={{ marginRight: '10px' }} />{carrera}</span>
                                <Chevron open={openC} />
                            </h2>

                            {openC && (
                                <div style={{ padding: '20px' }}>
                                    {Object.keys(evaluacionesAgrupadas[carrera]).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).map(semestre => {
                                        const semKey = `${carrera}|${semestre}`;
                                        const openSem = expandedSemestres[semKey];
                                        return (
                                        <div key={semestre} style={{ marginBottom: '20px' }}>
                                            <h3 onClick={() => toggleSemestre(semKey)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#334155', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '15px' }}>
                                                <span><i className="fas fa-layer-group" style={{ marginRight: '8px', color: '#64748b' }} />{semestre}</span>
                                                <Chevron open={openSem} />
                                            </h3>

                                            {openSem && Object.keys(evaluacionesAgrupadas[carrera][semestre]).sort((a,b) => a.localeCompare(b)).map(materia => {
                                                const mKey  = `${carrera}|${semestre}|${materia}`;
                                                const openM = expandedMaterias[mKey];
                                                return (
                                                    <div key={materia} style={{ marginLeft: '15px', marginBottom: '10px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>

                                                        {/* ══ NIVEL 2: MATERIA ══ */}
                                                        <h4 onClick={() => toggleMateria(mKey)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0, padding: '12px 16px', color: '#1e3a8a', background: '#eef2ff', borderBottom: openM ? '1px solid #c7d2fe' : 'none' }}>
                                                            <span><i className="fas fa-book" style={{ marginRight: '8px', color: '#3b82f6' }} />{materia}</span>
                                                            <Chevron open={openM} />
                                                        </h4>

                                                        {openM && (
                                                            <div style={{ padding: '12px 15px', background: '#f8fafc' }}>
                                                                {Object.keys(evaluacionesAgrupadas[carrera][semestre][materia]).sort((a,b) => a.localeCompare(b)).map(seccion => {
                                                                    const secData = evaluacionesAgrupadas[carrera][semestre][materia][seccion];
                                                                    const sKey    = `${mKey}|${seccion}`;
                                                                    const openS   = expandedSecciones[sKey];
                                                                    return (
                                                                        <div key={seccion} style={{ marginBottom: '10px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>

                                                                            {/* ══ NIVEL 3: SECCIÓN ══ */}
                                                                            <div onClick={() => toggleSeccion(sKey)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 16px', background: '#fef9ee', borderBottom: openS ? '1px solid #fde68a' : 'none', gap: '12px' }}>
                                                                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '0.9em', flexWrap: 'wrap', flex: 1 }}>
                                                                                    <strong style={{ color: '#92400e' }}>
                                                                                        <i className="fas fa-layer-group" style={{ marginRight: '7px', color: '#f59e0b' }} />{seccion}
                                                                                    </strong>
                                                                                    <span style={{ color: '#64748b' }}><i className="fas fa-clock" style={{ marginRight: '5px' }} />{secData.info.horario}</span>
                                                                                    <span style={{ color: '#64748b' }}><i className="fas fa-map-marker-alt" style={{ marginRight: '5px' }} />{secData.info.aula}</span>
                                                                                </div>
                                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            setModalMode('create');
                                                                                            setSelectedEvalId(null);
                                                                                            console.log(secData.info.carrera_codigo, secData.info.materia_codigo)
                                                                                            setPreloadedData({
                                                                                                carrera_codigo: secData.info.carrera_codigo,
                                                                                                materia_codigo: secData.info.materia_codigo,
                                                                                                id_seccion:     secData.info.id_seccion
                                                                                            });
                                                                                            setShowAddModal(true);
                                                                                        }}
                                                                                        disabled={!hasAvailableCortes}
                                                                                        style={{
                                                                                            padding: '5px 12px',
                                                                                            fontSize: '0.8em',
                                                                                            background: !hasAvailableCortes ? '#cbd5e1' : '#10b981',
                                                                                            color: 'white',
                                                                                            border: 'none',
                                                                                            borderRadius: '6px',
                                                                                            cursor: !hasAvailableCortes ? 'not-allowed' : 'pointer',
                                                                                            display: 'flex',
                                                                                            alignItems: 'center',
                                                                                            gap: '5px',
                                                                                            fontWeight: '600',
                                                                                            opacity: !hasAvailableCortes ? 0.7 : 1
                                                                                        }}
                                                                                        title={!hasAvailableCortes ? "No hay cortes disponibles" : "Agregar evaluación a esta sección"}
                                                                                    >
                                                                                        <i className="fas fa-plus" /> Agregar Evaluación
                                                                                    </button>
                                                                                    <Chevron open={openS} />
                                                                                </div>
                                                                            </div>

                                                                            {openS && (
                                                                                <div style={{ padding: '12px 15px', background: 'white' }}>
                                                                                    {Object.keys(secData.rubricas).length === 0 ? (
                                                                                        <div style={{ textAlign: 'center', padding: '30px', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #e2e8f0' }}>
                                                                                            <i className="fas fa-clipboard-list" style={{ fontSize: '2.5em', color: '#cbd5e1', marginBottom: '15px' }} />
                                                                                            <h4 style={{ color: '#64748b', margin: '0 0 15px 0' }}>No hay evaluaciones registradas en esta sección</h4>
                                                                                            <button 
                                                                                                className="btn-add-premium" 
                                                                                                style={{ margin: '0 auto', opacity: !hasAvailableCortes ? 0.6 : 1, cursor: !hasAvailableCortes ? 'not-allowed' : 'pointer' }}
                                                                                                onClick={() => { 
                                                                                                    if(hasAvailableCortes) { 
                                                                                                        setModalMode('create'); 
                                                                                                        setSelectedEvalId(null); 
                                                                                                        setPreloadedData({
                                                                                                            carrera_codigo: secData.info.carrera_codigo,
                                                                                                            materia_codigo: secData.info.materia_codigo,
                                                                                                            id_seccion:     secData.info.id_seccion
                                                                                                        });
                                                                                                        setShowAddModal(true); 
                                                                                                    } 
                                                                                                }}
                                                                                                disabled={!hasAvailableCortes}
                                                                                                title={!hasAvailableCortes ? "No hay cortes disponibles para crear evaluaciones" : ""}
                                                                                            >
                                                                                                <i className="fas fa-plus"></i> Agregar Evaluación
                                                                                            </button>
                                                                                        </div>
                                                                                    ) : (
                                                                                        Object.keys(secData.rubricas)
                                                                                            .sort((a, b) => {
                                                                                                const dateA = new Date(secData.rubricas[a].fecha_fija);
                                                                                                const dateB = new Date(secData.rubricas[b].fecha_fija);
                                                                                                return dateB - dateA;
                                                                                            })
                                                                                            .map(rubrica => {
                                                                                                const evalInfo = secData.rubricas[rubrica];
                                                                                                const rKey     = `${sKey}|${rubrica}`;
                                                                                                const openR    = expandedRubricas[rKey];
                                                                                                const students = estudiantesPorEvaluacion[evalInfo.id_evaluacion] || [];
                                                                                                const loadingS = loadingEvaluados[evalInfo.id_evaluacion];
                                                                                                
                                                                                                const filtrados = students.filter(ev => {
                                                                                                    if (!searchTerm) return true;
                                                                                                    const full = `${ev.estudiante_nombre} ${ev.estudiante_apellido}`.toLowerCase();
                                                                                                    return full.includes(searchTerm) || ev.estudiante_cedula.includes(searchTerm);
                                                                                                });

                                                                                                if (searchTerm && filtrados.length === 0 && !loadingS) return null;

                                                                                                return (
                                                                                                    <div key={rubrica} style={{ marginBottom: '10px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>

                                                                                                        {/* ══ NIVEL 4: RÚBRICA ══ */}
                                                                                                        <h5 onClick={() => toggleRubrica(rKey, evalInfo.id_evaluacion, !!evalInfo.rubrica_id)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0, padding: '10px 14px', color: evalInfo.rubrica_id ? '#065f46' : '#92400e', fontSize: '0.95em', background: evalInfo.rubrica_id ? '#f0fdf4' : '#fffbeb', borderBottom: openR ? (evalInfo.rubrica_id ? '1px solid #a7f3d0' : '1px solid #fde68a') : 'none' }}>
                                                                                                             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                                                                                                 <i className={evalInfo.rubrica_id ? "fas fa-clipboard-check" : "fas fa-exclamation-triangle"} style={{ color: evalInfo.rubrica_id ? '#10b981' : '#f59e0b' }} />
                                                                                                                 <span style={{ fontWeight: '600' }}>{rubrica}</span>
                                                                                                                 
                                                                                                                 {/* Action Buttons for Evaluation */}
                                                                                                                 <div className="evaluacion-actions">
                                                                                                                    <button 
                                                                                                                        className="action-btn-mini view" 
                                                                                                                        title="Ver Detalles"
                                                                                                                        onClick={(e) => handleOpenView(e, evalInfo.id_evaluacion)}
                                                                                                                    >
                                                                                                                        <i className="fas fa-eye"></i>
                                                                                                                    </button>
                                                                                                                     <button 
                                                                                                                         className="action-btn-mini edit" 
                                                                                                                         title="Editar"
                                                                                                                         onClick={(e) => handleOpenEdit(e, evalInfo.id_evaluacion)}
                                                                                                                         disabled={!evalInfo.canModify}
                                                                                                                     >
                                                                                                                         <i className="fas fa-edit"></i>
                                                                                                                     </button>
                                                                                                                     <button 
                                                                                                                         className="action-btn-mini delete" 
                                                                                                                         title="Eliminar"
                                                                                                                         onClick={(e) => handleDelete(e, evalInfo.id_evaluacion)}
                                                                                                                         disabled={!evalInfo.canModify}
                                                                                                                     >
                                                                                                                         <i className="fas fa-trash-alt"></i>
                                                                                                                     </button>
                                                                                                                 </div>

                                                                                                                 {openR && evalInfo.rubrica_id && !loadingS && (
                                                                                                                    <span style={{ background: '#d1fae5', color: '#065f46', borderRadius: '999px', padding: '2px 8px', fontSize: '0.78em', fontWeight: '600', marginLeft: '10px' }}>
                                                                                                                        {filtrados.length} estudiante{filtrados.length !== 1 ? 's' : ''}
                                                                                                                    </span>
                                                                                                                 )}
                                                                                                             </div>
                                                                                                             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                                                                 <span style={{ fontSize: '0.85em', color: evalInfo.rubrica_id ? '#065f46' : '#92400e', opacity: 0.6, fontWeight: '500' }}>
                                                                                                                     <i className="fas fa-calendar-alt" style={{ marginRight: '5px' }} />
                                                                                                                     {formatearFecha(evalInfo.fecha_fija)}
                                                                                                                 </span>
                                                                                                                 <Chevron open={openR} />
                                                                                                             </div>
                                                                                                         </h5>

                                                                                                        {openR && (
                                                                                                            <div style={{ padding: '15px' }}>
                                                                                                                {!evalInfo.rubrica_id ? (
                                                                                                                    <div style={{ textAlign: 'center', padding: '30px 20px', background: '#fff9db', borderRadius: '12px', border: '1px dashed #fcc419' }}>
                                                                                                                        <i className="fas fa-info-circle" style={{ fontSize: '2em', color: '#f59e0b', marginBottom: '15px', display: 'block' }} />
                                                                                                                        <h4 style={{ margin: '0 0 10px 0', color: '#92400e' }}>Se debe usar una rubrica para poder evaluar</h4>
                                                                                                                        <p style={{ color: '#b45309', fontSize: '0.9em', marginBottom: '20px' }}>Esta evaluación no tiene una rúbrica asociada. Por favor, crea una nueva o reutiliza una existente.</p>
                                                                                                                         <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                                                                                                                             <button 
                                                                                                                                className="action-btn-rubrica create"
                                                                                                                                onClick={() => navigate('/teacher/crear-rubricas', { 
                                                                                                      state: { 
                                                                                                          preloaded: {
                                                                                                              carrera: evalInfo.carrera_codigo,
                                                                                                              semestre: evalInfo.materia_semestre,
                                                                                                              materia_codigo: evalInfo.materia_codigo,
                                                                                                              seccion_id: evalInfo.id_seccion,
                                                                                                              evaluacion_id: evalInfo.id_evaluacion
                                                                                                          }
                                                                                                      }
                                                                                                  })} 
                                                                                                                                disabled={!evalInfo.canModify}
                                                                                                                                style={{ padding: '10px 20px', background: !evalInfo.canModify ? '#cbd5e1' : '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', cursor: !evalInfo.canModify ? 'not-allowed' : 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', opacity: !evalInfo.canModify ? 0.7 : 1 }}
                                                                                                                             >
                                                                                                                                 <i className="fas fa-plus" /> Crear Rúbrica
                                                                                                                             </button>
                                                                                                                             <button 
                                                                                                                                className="action-btn-rubrica reuse"
                                                                                                                                onClick={() => navigate('/teacher/rubricas')} 
                                                                                                                                disabled={!evalInfo.canModify}
                                                                                                                                style={{ padding: '10px 20px', background: 'white', color: !evalInfo.canModify ? '#94a3b8' : '#f59e0b', border: !evalInfo.canModify ? '1px solid #cbd5e1' : '1px solid #f59e0b', borderRadius: '8px', cursor: !evalInfo.canModify ? 'not-allowed' : 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', opacity: !evalInfo.canModify ? 0.7 : 1 }}
                                                                                                                             >
                                                                                                                                 <i className="fas fa-sync" /> Reutilizar Rúbrica
                                                                                                                             </button>
                                                                                                                         </div>
                                                                                                                    </div>
                                                                                                                ) : loadingS ? (
                                                                                                                    <div style={{ textAlign: 'center', padding: '20px' }}>
                                                                                                                        <i className="fas fa-spinner fa-spin" style={{ color: '#10b981' }} />
                                                                                                                        <p style={{ color: '#065f46', fontSize: '0.9em', marginTop: '10px' }}>Cargando estudiantes...</p>
                                                                                                                    </div>
                                                                                                                ) : filtrados.length === 0 ? (
                                                                                                                    <p style={{ textAlign: 'center', color: '#64748b' }}>No hay estudiantes para mostrar.</p>
                                                                                                                ) : (
                                                                                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                                                                                                                        {filtrados.map(ev => (
                                                                                                                            <div key={ev.estudiante_cedula + ev.id} className="evaluacion-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                                                                                                                {/* Ribbon */}
                                                                                                                                <div style={{ position: 'absolute', top: '12px', right: '-35px', background: ev.estado === 'Completada' ? '#10b981' : '#f59e0b', color: 'white', padding: '5px 40px', fontSize: '0.75em', fontWeight: 'bold', transform: 'rotate(45deg)', zIndex: 1 }}>
                                                                                                                                    {ev.estado}
                                                                                                                                </div>

                                                                                                                                <div>
                                                                                                                                    <h4 style={{ margin: '0 0 5px 0', fontSize: '1.2em', color: '#1e293b', fontWeight: 'bold', textTransform: 'uppercase' }}>{evalInfo.materia_nombre}</h4>
                                                                                                                                    <div style={{ color: '#3b82f6', fontSize: '0.9em', fontWeight: '500' }}>{evalInfo.materia_codigo} {evalInfo.seccion_codigo}</div>
                                                                                                                                </div>

                                                                                                                                <div>
                                                                                                                                    <div style={{ color: '#64748b', fontSize: '0.85em', fontWeight: '500', marginBottom: '2px' }}>Estudiante</div>
                                                                                                                                    <div style={{ color: '#1e293b', fontWeight: 'bold', fontSize: '1.1em' }}>{ev.estudiante_nombre} {ev.estudiante_apellido}</div>
                                                                                                                                    <div style={{ color: '#64748b', fontSize: '0.85em' }}>{ev.estudiante_cedula}</div>
                                                                                                                                </div>

                                                                                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px', padding: '12px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                                                                                                                    <div>
                                                                                                                                        <div style={{ color: '#64748b', fontSize: '0.75em', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nota Total</div>
                                                                                                                                        <div style={{ color: '#1e293b', fontWeight: '800', fontSize: '1.4em' }}>{ev.nota_total || '0.00'}<span style={{ fontSize: '0.6em', color: '#94a3b8', marginLeft: '2px' }}>/20</span></div>
                                                                                                                                    </div>
                                                                                                                                    <div style={{ textAlign: 'right' }}>
                                                                                                                                        <div style={{ color: '#64748b', fontSize: '0.75em', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Semestre</div>
                                                                                                                                        <div style={{ color: '#3b82f6', fontWeight: 'bold' }}>{ev.semestre}</div>
                                                                                                                                    </div>
                                                                                                                                </div>

                                                                                                                                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                                                                                                                                    {ev.estado === 'Completada' ? (
                                                                                                                                        <>
                                                                                                                                            <button 
                                                                                                                                                onClick={(e) => { e.stopPropagation(); setIsActionLoading(true); setSelectedEstudianteEvaluar({ idEvaluacion: ev.id_evaluacion, cedula: ev.estudiante_cedula }); setTimeout(() => { setIsActionLoading(false); setShowEvaluar(true); }, 800); }} 
                                                                                                                                                disabled={!evalInfo.canEvaluate}
                                                                                                                                                style={{ flex: 1.5, padding: '12px', background: !evalInfo.canEvaluate ? '#cbd5e1' : '#10b981', color: 'white', border: 'none', borderRadius: '10px', cursor: !evalInfo.canEvaluate ? 'not-allowed' : 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s', opacity: !evalInfo.canEvaluate ? 0.7 : 1 }}
                                                                                                                                                className="btn-card-action"
                                                                                                                                                title="Editar Evaluación"
                                                                                                                                            >
                                                                                                                                                <i className="fas fa-edit" />
                                                                                                                                            </button>
                                                                                                                                            <button onClick={(e) => { e.stopPropagation(); setIsActionLoading(true); setSelectedEstudianteDetalles({ idEvaluacion: ev.id_evaluacion, cedula: ev.estudiante_cedula }); setTimeout(() => { setIsActionLoading(false); setShowDetalles(true); }, 800); }} style={{ flex: 1, padding: '10px', background: 'white', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }} className="btn-card-action" title="Ver Detalles"><i className="fas fa-eye" /></button>
                                                                                                                                            <button style={{ flex: 1, padding: '10px', background: 'white', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', opacity: 0.6 }} title="Estadísticas (Próximamente)"><i className="fas fa-chart-line" /></button>
                                                                                                                                        </>
                                                                                                                                    ) : (
                                                                                                                                        <button 
                                                                                                                                            onClick={(e) => { e.stopPropagation(); setIsActionLoading(true); setSelectedEstudianteEvaluar({ idEvaluacion: ev.id_evaluacion, cedula: ev.estudiante_cedula }); setTimeout(() => { setIsActionLoading(false); setShowEvaluar(true); }, 800); }} 
                                                                                                                                            disabled={!evalInfo.canEvaluate}
                                                                                                                                            style={{ width: '100%', padding: '10px', background: !evalInfo.canEvaluate ? '#cbd5e1' : '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: !evalInfo.canEvaluate ? 'not-allowed' : 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: !evalInfo.canEvaluate ? 0.7 : 1 }}
                                                                                                                                        >
                                                                                                                                            <i className="fas fa-clipboard-check" /> Evaluar Estudiante
                                                                                                                                        </button>
                                                                                                                                    )}
                                                                                                                                </div>
                                                                                                                            </div>
                                                                                                                        ))}
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
        );
    };

    if (!user) return null;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
            <Menu user={user} />
            <main className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Header title="Mis Evaluaciones" user={user} onLogout={() => navigate('/login')} />

                <div style={{ padding: '30px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ position: 'relative', width: '300px' }}>
                            <i className="fas fa-search" style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
                            <input type="text" placeholder="Buscar Alumno (Nombre o CI)..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value.toLowerCase())} style={{ width: '100%', padding: '10px 10px 10px 35px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={fetchEvaluaciones} style={{ padding: '10px 15px', background: '#f1f5f9', color: '#334155', border: 'none', borderRadius: '8px', cursor: 'pointer' }} title="Actualizar"><i className="fas fa-sync-alt" /></button>
                            <button 
                                onClick={() => { setModalMode('create'); setSelectedEvalId(null); setShowAddModal(true); }} 
                                disabled={!hasAvailableCortes}
                                style={{ 
                                    padding: '10px 15px', 
                                    background: !hasAvailableCortes ? '#94a3b8' : '#10b981', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '8px', 
                                    cursor: !hasAvailableCortes ? 'not-allowed' : 'pointer', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '8px', 
                                    fontWeight: '500',
                                    opacity: !hasAvailableCortes ? 0.7 : 1
                                }}
                                title={!hasAvailableCortes ? "No hay cortes disponibles para crear evaluaciones" : ""}
                            >
                                <i className="fas fa-plus" /> Agregar Evaluación
                            </button>
                        </div>
                    </div>

                    {renderContent()}
                </div>
            </main>

            {showEvaluar && selectedEstudianteEvaluar && (
                <ModalEvaluar 
                    data={selectedEstudianteEvaluar} 
                    onClose={() => setShowEvaluar(false)} 
                    onSaved={() => { 
                        setShowEvaluar(false); 
                        fetchEvaluaciones(); 
                        if (selectedEstudianteEvaluar?.idEvaluacion) {
                            fetchEstudiantesDeEvaluacion(selectedEstudianteEvaluar.idEvaluacion, true);
                        }
                    }} 
                />
            )}
            {showDetalles && selectedEstudianteDetalles && (
                <ModalVerDetalles data={selectedEstudianteDetalles} onClose={() => setShowDetalles(false)} />
            )}
            {showAddModal && (
                <ModalAddEvaluacion 
                    onClose={() => { setShowAddModal(false); setPreloadedData(null); }} 
                    onSaved={() => { 
                        setShowAddModal(false); 
                        setPreloadedData(null);
                        fetchEvaluaciones(); 
                    }} 
                    mode={modalMode}
                    currentEvalId={selectedEvalId}
                    preloadedData={preloadedData}
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
    );
}