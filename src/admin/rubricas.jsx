import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Menu from '../components/menu';
import Header from '../components/header';
import { rubricasService } from '../services/rubricas.service';
import { academicoService } from '../services/academico.service';
import Swal from 'sweetalert2';
import { imprimirRubricaFormal } from '../utils/printRubrica';
import '../assets/css/home.css';

import { useUI } from '../context/UIContext';

export default function Rubricas() {
    const { periodoActual } = useUI();
    const navigate = useNavigate();
    const { setLoading: setGlobalLoading } = useUI();
    const [user] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    // Estados de datos
    const [rubricas, setRubricas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [professorFilter, setProfessorFilter] = useState('');

    // Estados de paginación
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // Estado del Modal de Edición
    const [modalMode, setModalMode] = useState(null);
    const [currentRubricaId, setCurrentRubricaId] = useState(null);
    const [formData, setFormData] = useState({
        nombre_rubrica: '',
        id_tipo: '',
        carrera_codigo: '',
        semestre: '',
        materia_codigo: '',
        seccion_id: '',
        evaluacion_id: '',
        fecha_evaluacion: '',
        porcentaje_evaluacion: 10,
        competencias: '',
        instrumentos: '',
        instrucciones: '',
        estrategias: [],
        criterios: []
    });

    // Estados para selects en el modal
    const [tiposRubrica, setTiposRubrica] = useState([]);
    const [carreras, setCarreras] = useState([]);
    const [semestres, setSemestres] = useState([]);
    const [materias, setMaterias] = useState([]);
    const [secciones, setSecciones] = useState([]);
    const [evaluaciones, setEvaluaciones] = useState([]);

    const loadInitialData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await rubricasService.getRubricas();
            setRubricas(data);
        } catch {
            Swal.fire('Error', 'No se pudieron cargar las rúbricas', 'error');
        } finally {
            setLoading(false);
            setGlobalLoading(false);
        }
    }, [setGlobalLoading]);

    useEffect(() => {
        if (!user) {
            navigate('/login');
        } else {
            loadInitialData();
        }
    }, [periodoActual, user, navigate, loadInitialData]);

    // Filtrado y Paginación
    const filteredRubricas = useMemo(() => {
        return rubricas.filter(rubrica => {
            const matchesSearch =
                rubrica.nombre_rubrica?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                rubrica.materia_nombre?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesProfessor = professorFilter === '' || rubrica.docente_nombre === professorFilter;
            return matchesSearch && matchesProfessor;
        });
    }, [rubricas, searchTerm, professorFilter]);

    const profesoresUnicos = useMemo(() => {
        const names = rubricas.map(r => r.docente_nombre);
        return [...new Set(names)].filter(Boolean).sort();
    }, [rubricas]);

    const paginatedRubricas = useMemo(() => {
        if (entriesPerPage === 'todos') return filteredRubricas;
        const start = (currentPage - 1) * parseInt(entriesPerPage);
        return filteredRubricas.slice(start, start + parseInt(entriesPerPage));
    }, [filteredRubricas, currentPage, entriesPerPage]);

    const totalPages = useMemo(() => {
        if (entriesPerPage === 'todos') return 1;
        return Math.ceil(filteredRubricas.length / parseInt(entriesPerPage)) || 1;
    }, [filteredRubricas, entriesPerPage]);

    // Ver / Imprimir rúbrica
    const handleVerRubrica = async (id) => {
        try {
            Swal.fire({ title: 'Cargando rúbrica...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            const data = await rubricasService.getRubricaDetalle(id);
            if (data.success) {
                Swal.close();
                imprimirRubricaFormal(data.rubrica, data.criterios);
            } else {
                Swal.fire('Error', 'No se pudo obtener el detalle de la rúbrica', 'error');
            }
        } catch {
            Swal.fire('Error', 'No se pudo cargar el detalle', 'error');
        }
    };

    // Manejadores de Cascada
    const handleCarreraChange = async (codigo) => {
        if (!codigo) { setSemestres([]); return; }
        const data = await academicoService.getSemestres(codigo);
        setSemestres(data);
    };

    const handleSemestreChange = async (carCod, sem) => {
        if (!sem) { setMaterias([]); return; }
        const data = await academicoService.getMaterias(carCod, sem);
        setMaterias(data);
    };

    const handleMateriaChange = async (matCod, carCod) => {
        if (!matCod) { setSecciones([]); return; }
        const data = await academicoService.getSecciones(matCod, carCod);
        setSecciones(data);
    };

    const handleSeccionChange = async (secId) => {
        if (!secId) { setEvaluaciones([]); return; }
        const data = await rubricasService.getEvaluacionesConRubrica(secId);
        setEvaluaciones(data);
    };

    // FIX #2: usar 'valor' que es el campo real del objeto retornado por el backend
    const handleEvaluacionChange = (evalId) => {
        const evaluacion = evaluaciones.find(e => e.evaluacion_id == evalId);
        if (!evaluacion) return;

        const nuevoPorcentaje = evaluacion.valor || evaluacion.ponderacion || 10;
        const nuevosCriterios = redistribuirPuntajes(nuevoPorcentaje, formData.criterios);

        setFormData(prev => ({
            ...prev,
            evaluacion_id: evalId,
            porcentaje_evaluacion: nuevoPorcentaje,
            criterios: nuevosCriterios
        }));
    };

    // Apertura del Modal de Edición
    const handleEditRubrica = async (id) => {
        try {
            Swal.fire({ title: 'Cargando datos...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

            const [tipos, , carrs] = await Promise.all([
                rubricasService.getTiposRubrica(),
                rubricasService.getEstrategiasEval(),
                academicoService.getCarreras()
            ]);

            setTiposRubrica(tipos);
            setCarreras(carrs);

            const res = await rubricasService.getRubricaForEdit(id);
            if (res.success) {
                const r = res.rubrica;
                setCurrentRubricaId(id);

                const jerarquia = await rubricasService.getCarreraXSeccion(r.id_seccion);

                // Cargar selects en cascada secuencialmente para garantizar estado correcto
                await handleCarreraChange(jerarquia.carrera_codigo);
                await handleSemestreChange(jerarquia.carrera_codigo, jerarquia.semestre);
                await handleMateriaChange(r.materia_codigo, jerarquia.carrera_codigo);
                await handleSeccionChange(r.seccion_id);

                setFormData({
                    nombre_rubrica: r.nombre_rubrica,
                    id_tipo: r.id_tipo,
                    carrera_codigo: jerarquia.carrera_codigo,
                    semestre: jerarquia.semestre,
                    materia_codigo: r.materia_codigo,
                    seccion_id: r.seccion_id,
                    evaluacion_id: r.evaluacion_id,
                    fecha_evaluacion: r.fecha_evaluacion ? r.fecha_evaluacion.split('T')[0] : '',
                    porcentaje_evaluacion: r.porcentaje_evaluacion,
                    competencias: r.competencias || '',
                    instrumentos: r.instrumentos || '',
                    instrucciones: r.instrucciones || '',
                    estrategias: r.estrategias ? r.estrategias.map(e => e.id) : [],
                    criterios: res.criterios.map((c, idx) => ({
                        id_local: idx + 1,
                        descripcion: c.descripcion,
                        puntaje_maximo: c.puntaje_maximo,
                        orden: c.orden,
                        niveles: c.niveles.map((n, nidx) => ({
                            id_local: nidx + 1,
                            nombre_nivel: n.nombre_nivel,
                            descripcion: n.descripcion,
                            puntaje: n.puntaje,
                            orden: n.orden
                        }))
                    }))
                });

                setModalMode('edit');
                Swal.close();
            } else {
                Swal.fire('Error', res.message || 'No se pudo cargar la rúbrica', 'error');
            }
        } catch (error) {
            console.error('Error handleEditRubrica:', error);
            Swal.fire('Error', error.message || 'Error al cargar los datos de edición', 'error');
        }
    };

    const redistribuirPuntajes = (porcentaje, criterios) => {
        if (!criterios.length) return criterios;

        const numCriterios = criterios.length;
        const puntajeBase = Math.floor((porcentaje / numCriterios) * 1000) / 1000;
        const resto = parseFloat((porcentaje - puntajeBase * numCriterios).toFixed(3));

        return criterios.map((c, idx) => {
            const nuevoMax = idx === numCriterios - 1
                ? parseFloat((puntajeBase + resto).toFixed(3))
                : puntajeBase;

            return {
                ...c,
                puntaje_maximo: nuevoMax,
                niveles: c.niveles.map((n) => {
                    let nuevoPuntaje = n.puntaje;
                    const nombre = (n.nombre_nivel || n.nombre || '').toLowerCase();

                    if (nombre.includes('excelente') || nombre.includes('sobresaliente')) {
                        nuevoPuntaje = nuevoMax;
                    } else if (nombre.includes('notable')) {
                        nuevoPuntaje = parseFloat((nuevoMax * 0.8).toFixed(3));
                    } else if (nombre.includes('aprobado') || nombre.includes('regular')) {
                        const factor = nombre.includes('aprobado') ? 0.6 : 0.5;
                        nuevoPuntaje = parseFloat((nuevoMax * factor).toFixed(3));
                    } else if (nombre.includes('insuficiente') || nombre.includes('deficiente')) {
                        nuevoPuntaje = 0;
                    }

                    if (!nombre.includes('insuficiente') && !nombre.includes('deficiente') && nuevoPuntaje < 0.025) {
                        nuevoPuntaje = 0.025;
                    }

                    return { ...n, puntaje: nuevoPuntaje };
                })
            };
        });
    };

    const handleAddCriterio = () => {
        const nuevoCriterio = {
            id_local: Date.now(),
            descripcion: '',
            puntaje_maximo: '',
            orden: formData.criterios.length + 1,
            niveles: [
                { id_local: Date.now() + 1, nombre_nivel: 'Excelente', descripcion: '', puntaje: '', orden: 1 },
                { id_local: Date.now() + 2, nombre_nivel: 'Regular', descripcion: '', puntaje: '', orden: 2 },
                { id_local: Date.now() + 3, nombre_nivel: 'Deficiente', descripcion: '', puntaje: 0, orden: 3 }
            ]
        };

        const nuevosCriterios = redistribuirPuntajes(formData.porcentaje_evaluacion, [...formData.criterios, nuevoCriterio]);
        setFormData(prev => ({ ...prev, criterios: nuevosCriterios }));
    };

    const handleRemoveCriterio = (idx) => {
        if (formData.criterios.length <= 1) {
            return Swal.fire('Aviso', 'Debe haber al menos un criterio', 'info');
        }
        const tempCriterios = [...formData.criterios];
        tempCriterios.splice(idx, 1);
        const nuevosCriterios = redistribuirPuntajes(formData.porcentaje_evaluacion, tempCriterios);
        setFormData(prev => ({ ...prev, criterios: nuevosCriterios }));
    };

    const handleCriterioChange = (idx, field, value) => {
        const newCriterios = [...formData.criterios];

        if (field === 'puntaje_maximo') {
            const val = parseFloat(value) || 0;
            newCriterios[idx][field] = val;
            const excelenteIdx = newCriterios[idx].niveles.findIndex(n => n.nombre_nivel === 'Excelente');
            if (excelenteIdx !== -1) {
                newCriterios[idx].niveles[excelenteIdx].puntaje = val;
            }
        } else {
            newCriterios[idx][field] = value;
        }

        setFormData(prev => ({ ...prev, criterios: newCriterios }));
    };

    const handleNivelChange = (cIdx, nIdx, field, value) => {
        const newCriterios = [...formData.criterios];

        if (field === 'puntaje') {
            const val = parseFloat(value) || 0;
            const max = parseFloat(newCriterios[cIdx].puntaje_maximo) || 0;

            if (val > max) {
                Swal.fire('Aviso', 'El puntaje del nivel no puede ser mayor al máximo del criterio', 'warning');
                newCriterios[cIdx].niveles[nIdx][field] = max;
            } else {
                newCriterios[cIdx].niveles[nIdx][field] = val;
            }
        } else {
            newCriterios[cIdx].niveles[nIdx][field] = value;
        }

        setFormData(prev => ({ ...prev, criterios: newCriterios }));
    };

    const handleEliminarRubrica = async (id) => {
        const result = await Swal.fire({
            title: '¿Eliminar rúbrica?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar'
        });

        if (result.isConfirmed) {
            try {
                const res = await rubricasService.deleteRubrica(id);
                if (res.success) {
                    Swal.fire('Eliminado', 'La rúbrica ha sido eliminada', 'success');
                    loadInitialData();
                }
            } catch {
                Swal.fire('Error', 'No se pudo eliminar', 'error');
            }
        }
    };

    const totalPuntosCriterios = formData.criterios.reduce(
        (acc, c) => acc + (parseFloat(c.puntaje_maximo) || 0), 0
    );

    // FIX #1: NO hacer JSON.stringify a criterios — ya se serializa en el service
    // FIX #2: el payload usa los nombres exactos que espera el backend
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.nombre_rubrica || !formData.id_tipo || !formData.evaluacion_id) {
            return Swal.fire('Atención', 'Complete los campos obligatorios del encabezado', 'warning');
        }

        const totalPuntos = formData.criterios.reduce(
            (acc, c) => acc + parseFloat(c.puntaje_maximo || 0), 0
        );
        if (Math.abs(totalPuntos - formData.porcentaje_evaluacion) > 0.01) {
            return Swal.fire(
                'Error de Puntos',
                `La suma de criterios (${totalPuntos.toFixed(2)}) debe ser igual al porcentaje (${formData.porcentaje_evaluacion}%)`,
                'error'
            );
        }

        for (const crit of formData.criterios) {
            if (parseFloat(crit.puntaje_maximo) < 0.025) {
                return Swal.fire('Error', `El puntaje del criterio "${crit.descripcion}" debe ser al menos 0.025`, 'error');
            }
            for (const nivel of crit.niveles) {
                if (nivel.nombre_nivel !== 'Deficiente' && parseFloat(nivel.puntaje) < 0.025) {
                    return Swal.fire('Error', `El nivel "${nivel.nombre_nivel}" del criterio "${crit.descripcion}" debe tener al menos 0.025 puntos`, 'error');
                }
            }
        }

        try {
            Swal.fire({ title: 'Actualizando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

            // Payload con nombres exactos que espera el backend y criterios como array (NO string)
            const payload = {
                nombre_rubrica: formData.nombre_rubrica,
                id_evaluacion: formData.evaluacion_id,
                tipo_rubrica: formData.id_tipo,
                instrucciones: formData.instrucciones,
                porcentaje: formData.porcentaje_evaluacion,
                criterios: formData.criterios   // ← array directo, sin JSON.stringify
            };

            const res = await rubricasService.updateRubrica(currentRubricaId, payload);
            if (res.success) {
                Swal.fire('Éxito', 'Rúbrica actualizada correctamente', 'success');
                setModalMode(null);
                loadInitialData();
            } else {
                Swal.fire('Error', res.mensaje || 'Error al actualizar', 'error');
            }
        } catch (error) {
            Swal.fire('Error', error.message || 'Fallo de conexión', 'error');
        }
    };

    if (!user) return null;

    return (
        <main className="main-content">
            <Menu user={user} />
            <div className="content-wrapper" style={{ width: '100%' }}>
                <Header title="Banco de Rúbricas" user={user} onLogout={() => navigate('/login')} />

                <div style={{ padding: '30px' }}>
                    <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center', gap: '20px' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Mostrar:</span>
                            <select
                                value={entriesPerPage}
                                onChange={(e) => { setEntriesPerPage(e.target.value); setCurrentPage(1); }}
                                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                            >
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="20">20</option>
                                <option value="todos">Todos</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '15px', flex: 1, maxWidth: '600px' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <i className="fas fa-search" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre o materia..."
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    style={{ width: '100%', padding: '10px 15px 10px 45px', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                                />
                            </div>
                            <select
                                value={professorFilter}
                                onChange={(e) => { setProfessorFilter(e.target.value); setCurrentPage(1); }}
                                style={{ padding: '10px 15px', borderRadius: '10px', border: '1px solid #e2e8f0', minWidth: '180px' }}
                            >
                                <option value="">Todos los profesores</option>
                                {profesoresUnicos.map(prof => (
                                    <option key={prof} value={prof}>{prof}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={() => navigate('/admin/crear-rubricas')}
                            className="btns"
                            style={{ background: '#1e3a8a', color: 'white', padding: '10px 25px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}
                        >
                            <i className="fas fa-plus"></i> Nueva Rúbrica
                        </button>
                    </div>

                    <div className="card" style={{ borderRadius: '15px', background: '#fff', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                    <tr>
                                        <th style={{ padding: '15px', textAlign: 'left', color: '#64748b' }}>Rúbrica / Materia</th>
                                        <th style={{ padding: '15px', textAlign: 'left', color: '#64748b' }}>Evaluación</th>
                                        <th style={{ padding: '15px', textAlign: 'center', color: '#64748b' }}>Puntos</th>
                                        <th style={{ padding: '15px', textAlign: 'left', color: '#64748b' }}>Docente</th>
                                        <th style={{ padding: '15px', textAlign: 'center', color: '#64748b' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>Cargando rúbricas...</td></tr>
                                    ) : paginatedRubricas.length > 0 ? (
                                        paginatedRubricas.map((r) => (
                                            <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '15px' }}>
                                                    <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{r.nombre_rubrica}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{r.materia_nombre} - {r.seccion_codigo}</div>
                                                </td>
                                                <td style={{ padding: '15px' }}>
                                                    <div style={{ fontSize: '0.9rem' }}>{r.tipo_evaluacion}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(r.fecha_evaluacion).toLocaleDateString('es-ES')}</div>
                                                </td>
                                                <td style={{ padding: '15px', textAlign: 'center' }}>
                                                    <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                                        {r.porcentaje_evaluacion}%
                                                    </span>
                                                </td>
                                                <td style={{ padding: '15px' }}>
                                                    <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>{r.docente_nombre}</div>
                                                </td>
                                                <td style={{ padding: '15px', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                        <button onClick={() => handleVerRubrica(r.id)} className="btns" style={{ background: '#94a3b8', color: 'white', padding: '8px', borderRadius: '8px' }} title="Ver">
                                                            <i className="fas fa-eye"></i>
                                                        </button>
                                                        <button onClick={() => handleEditRubrica(r.id)} className="btns" style={{ background: '#3b82f6', color: 'white', padding: '8px', borderRadius: '8px' }} title="Editar">
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                        <button onClick={() => handleEliminarRubrica(r.id)} className="btns" style={{ background: '#ef4444', color: 'white', padding: '8px', borderRadius: '8px' }} title="Eliminar">
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No se encontraron rúbricas.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginación */}
                        {entriesPerPage !== 'todos' && totalPages > 1 && (
                            <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', gap: '5px', borderTop: '1px solid #f1f5f9' }}>
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(p => p - 1)}
                                    className="btns"
                                    style={{ padding: '8px 12px', background: 'white', border: '1px solid #e2e8f0', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                                >
                                    <i className="fas fa-chevron-left"></i>
                                </button>
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => setCurrentPage(i + 1)}
                                        style={{
                                            padding: '8px 15px',
                                            borderRadius: '8px',
                                            border: '1px solid #e2e8f0',
                                            background: currentPage === i + 1 ? '#1e3a8a' : 'white',
                                            color: currentPage === i + 1 ? 'white' : '#1e293b',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(p => p + 1)}
                                    className="btns"
                                    style={{ padding: '8px 12px', background: 'white', border: '1px solid #e2e8f0', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                                >
                                    <i className="fas fa-chevron-right"></i>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* MODAL DE EDICIÓN */}
                {modalMode === 'edit' && (
                    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                        <div className="modal-content" style={{ background: 'white', borderRadius: '15px', width: '95%', maxWidth: '1200px', maxHeight: '90vh', overflowY: 'auto' }}>
                            <div className="modal-header" style={{ padding: '20px 30px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                                <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1e3a8a' }}><i className="fas fa-edit"></i> Editar Rúbrica</h2>
                                <button onClick={() => setModalMode(null)} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
                            </div>

                            <form onSubmit={handleSubmit} style={{ padding: '30px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Nombre de la Rúbrica *</label>
                                        <input
                                            type="text"
                                            value={formData.nombre_rubrica}
                                            onChange={(e) => setFormData(prev => ({ ...prev, nombre_rubrica: e.target.value }))}
                                            className="form-input"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Tipo de Rúbrica *</label>
                                        <select
                                            value={formData.id_tipo}
                                            onChange={(e) => setFormData(prev => ({ ...prev, id_tipo: e.target.value }))}
                                            className="form-select"
                                            required
                                        >
                                            <option value="">Seleccione tipo</option>
                                            {tiposRubrica.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <div>
                                        <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Carrera</label>
                                        <select
                                            value={formData.carrera_codigo}
                                            onChange={(e) => {
                                                setFormData(prev => ({ ...prev, carrera_codigo: e.target.value }));
                                                handleCarreraChange(e.target.value);
                                            }}
                                            className="form-select"
                                        >
                                            <option value="">Seleccione carrera</option>
                                            {carreras.map(c => <option key={c.codigo} value={c.codigo}>{c.nombre}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Semestre</label>
                                        <select
                                            value={formData.semestre}
                                            onChange={(e) => {
                                                setFormData(prev => ({ ...prev, semestre: e.target.value }));
                                                handleSemestreChange(formData.carrera_codigo, e.target.value);
                                            }}
                                            className="form-select"
                                            disabled={!semestres.length}
                                        >
                                            <option value="">Seleccione semestre</option>
                                            {semestres.map(s => <option key={s} value={s}>Semestre {s}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Materia</label>
                                        <select
                                            value={formData.materia_codigo}
                                            onChange={(e) => {
                                                setFormData(prev => ({ ...prev, materia_codigo: e.target.value }));
                                                handleMateriaChange(e.target.value, formData.carrera_codigo);
                                            }}
                                            className="form-select"
                                            disabled={!materias.length}
                                        >
                                            <option value="">Seleccione materia</option>
                                            {materias.map(m => <option key={m.codigo} value={m.codigo}>{m.nombre}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Sección</label>
                                        <select
                                            value={formData.seccion_id}
                                            onChange={(e) => {
                                                setFormData(prev => ({ ...prev, seccion_id: e.target.value }));
                                                handleSeccionChange(e.target.value);
                                            }}
                                            className="form-select"
                                            disabled={!secciones.length}
                                        >
                                            <option value="">Seleccione sección</option>
                                            {secciones.map(s => <option key={s.id} value={s.id}>{s.codigo}</option>)}
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                        <div style={{ flex: 1, marginRight: '20px' }}>
                                            <label style={{ fontWeight: '600', fontSize: '0.85rem' }}>Evaluación</label>
                                            <select
                                                value={formData.evaluacion_id}
                                                onChange={(e) => handleEvaluacionChange(e.target.value)}
                                                className="form-select"
                                                required
                                                disabled={!evaluaciones.length}
                                            >
                                                <option value="">Seleccione evaluación</option>
                                                {evaluaciones.map(ev => (
                                                    <option key={ev.evaluacion_id} value={ev.evaluacion_id}>
                                                        {ev.contenido_evaluacion || ev.competencias} ({ev.valor || ev.ponderacion}%)
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div style={{ background: '#e0f2fe', padding: '10px 20px', borderRadius: '10px', border: '1px solid #7dd3fc', textAlign: 'center' }}>
                                            <div style={{ fontSize: '0.75rem', color: '#0369a1', fontWeight: 'bold', textTransform: 'uppercase' }}>Suma de Criterios</div>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: Math.abs(totalPuntosCriterios - formData.porcentaje_evaluacion) < 0.01 ? '#059669' : '#ef4444' }}>
                                                {totalPuntosCriterios.toFixed(2)} / {formData.porcentaje_evaluacion}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="criterios-container">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #1e3a8a', paddingBottom: '10px', marginBottom: '20px' }}>
                                        <h3 style={{ margin: 0, color: '#1e3a8a' }}>Criterios de Evaluación</h3>
                                        <button
                                            type="button"
                                            onClick={handleAddCriterio}
                                            className="btns"
                                            style={{ background: '#10b981', color: 'white', padding: '8px 15px', borderRadius: '8px', fontSize: '0.9rem' }}
                                        >
                                            <i className="fas fa-plus"></i> Agregar Criterio
                                        </button>
                                    </div>

                                    {formData.criterios.map((c, cIdx) => (
                                        <div key={c.id_local || cIdx} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '20px', position: 'relative' }}>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveCriterio(cIdx)}
                                                style={{ position: 'absolute', top: '10px', right: '10px', background: '#fee2e2', color: '#ef4444', border: 'none', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                title="Eliminar criterio"
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>

                                            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', paddingRight: '40px' }}>
                                                <input
                                                    type="text"
                                                    placeholder="Descripción del criterio..."
                                                    value={c.descripcion}
                                                    onChange={(e) => handleCriterioChange(cIdx, 'descripcion', e.target.value)}
                                                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                                    required
                                                />
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    <input
                                                        type="number"
                                                        step="0.001"
                                                        placeholder="Pts"
                                                        value={c.puntaje_maximo}
                                                        onChange={(e) => handleCriterioChange(cIdx, 'puntaje_maximo', e.target.value)}
                                                        style={{ width: '100px', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}
                                                        required
                                                    />
                                                    <span style={{ fontWeight: 'bold' }}>Pts</span>
                                                </div>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                                                {c.niveles.map((n, nIdx) => (
                                                    <div key={n.id_local || nIdx} style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                                                        <input
                                                            type="text"
                                                            value={n.nombre_nivel}
                                                            onChange={(e) => handleNivelChange(cIdx, nIdx, 'nombre_nivel', e.target.value)}
                                                            style={{ fontWeight: 'bold', border: 'none', background: 'transparent', width: '100%', marginBottom: '5px', color: '#475569' }}
                                                        />
                                                        <textarea
                                                            value={n.descripcion}
                                                            onChange={(e) => handleNivelChange(cIdx, nIdx, 'descripcion', e.target.value)}
                                                            style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '0.85rem', padding: '8px', marginBottom: '5px', resize: 'vertical' }}
                                                            rows="3"
                                                            placeholder="Descripción del nivel..."
                                                        />
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                            <input
                                                                type="number"
                                                                step="0.001"
                                                                min="0"
                                                                value={n.puntaje}
                                                                onChange={(e) => handleNivelChange(cIdx, nIdx, 'puntaje', e.target.value)}
                                                                style={{ width: '80px', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '4px', fontSize: '0.9rem', color: '#1e3a8a', fontWeight: 'bold' }}
                                                                placeholder="0"
                                                            />
                                                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>pts</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', borderTop: '1px solid #e5e7eb', paddingTop: '25px', marginTop: '30px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setModalMode(null)}
                                        className="btns"
                                        style={{ background: '#94a3b8', color: 'white', padding: '12px 30px', borderRadius: '10px' }}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="btns"
                                        style={{ background: '#1e3a8a', color: 'white', padding: '12px 45px', borderRadius: '10px', fontWeight: 'bold' }}
                                    >
                                        <i className="fas fa-save" style={{ marginRight: '8px' }}></i> Guardar Cambios
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}