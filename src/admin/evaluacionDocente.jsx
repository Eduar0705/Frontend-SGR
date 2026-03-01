import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Menu from '../components/menu';
import Header from '../components/header';
import { academicoService } from '../services/academico.service';
import Swal from 'sweetalert2';
import '../assets/css/home.css';

export default function EvaluacionDocente() {
    const navigate = useNavigate();
    const [user] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    // Estados de datos
    const [evaluaciones, setEvaluaciones] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    // Estados de paginación
    const [entriesPerPage] = useState(5);
    const [currentPage, setCurrentPage] = useState(1);

    // Estado del Modal
    const [modalMode, setModalMode] = useState(null); // 'create', 'edit', 'view'
    const [selectedDocente, setSelectedDocente] = useState(null);
    const [permisosDocente, setPermisosDocente] = useState(null);
    const [currentEvalId, setCurrentEvalId] = useState(null);

    // Estado del Formulario de Evaluación
    const [formData, setFormData] = useState({
        unidad_curricular: '',
        semestre: '',
        carrera_codigo: '',
        seccion_id: '',
        sugerencias: '',
        criterios: Array(7).fill().map(() => ({ calificacion: '', observaciones: '' }))
    });

    const loadEvaluaciones = useCallback(async () => {
        try {
            setLoading(true);
            const data = await academicoService.getEvaluacionesDocentes();
            setEvaluaciones(data);
        } catch (error) {
            console.error('Error cargando evaluaciones:', error);
            Swal.fire('Error', 'No se pudieron cargar las evaluaciones docentes', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!user) {
            navigate('/login');
        } else {
            loadEvaluaciones();
        }
    }, [user, navigate, loadEvaluaciones]);

    // Filtrado y Paginación
    const filteredEvaluaciones = useMemo(() => {
        return evaluaciones.filter(evalu => 
            evalu.docente_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            evalu.cedula?.includes(searchTerm)
        );
    }, [evaluaciones, searchTerm]);

    const paginatedEvaluaciones = useMemo(() => {
        const start = (currentPage - 1) * entriesPerPage;
        return filteredEvaluaciones.slice(start, start + entriesPerPage);
    }, [filteredEvaluaciones, currentPage, entriesPerPage]);

    const totalPages = Math.ceil(filteredEvaluaciones.length / entriesPerPage);

    // Manejadores del Modal
    const openCreateModal = async (docente) => {
        setSelectedDocente(docente);
        resetForm();
        try {
            Swal.fire({ title: 'Cargando permisos...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            const permisos = await academicoService.getPermisosDocente(docente.cedula);
            setPermisosDocente(permisos);
            setModalMode('create');
            Swal.close();
        } catch {
            Swal.fire('Error', 'No se pudieron cargar los permisos del docente', 'error');
        }
    };

    const openEditModal = async (evalu) => {
        try {
            Swal.fire({ title: 'Cargando datos...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            const result = await academicoService.getEvaluacionDocenteDetalle(evalu.evaluacion_id);
            if (result.success) {
                const ev = result.evaluacion;
                setCurrentEvalId(evalu.evaluacion_id);
                setSelectedDocente({ cedula: evalu.cedula, docente_nombre: ev.docente_nombre });
                
                // Cargar permisos primero para que los selects tengan opciones
                const permisos = await academicoService.getPermisosDocente(evalu.cedula);
                setPermisosDocente(permisos);

                // Mapear criterios
                const mappedCriterios = [];
                for (let i = 1; i <= 7; i++) {
                    mappedCriterios.push({
                        calificacion: ev[`criterio${i}_calificacion`] || '',
                        observaciones: ev[`criterio${i}_observaciones`] || ''
                    });
                }

                setFormData({
                    unidad_curricular: ev.unidad_curricular || '',
                    semestre: ev.semestre || '',
                    carrera_codigo: ev.carrera_codigo || '',
                    seccion_id: ev.seccion_id || '',
                    sugerencias: ev.sugerencias || '',
                    criterios: mappedCriterios
                });
                
                setModalMode('edit');
                Swal.close();
            }
        } catch {
            Swal.fire('Error', 'No se pudo cargar la evaluación', 'error');
        }
    };

    const openViewModal = async (evalId) => {
        try {
            Swal.fire({ title: 'Cargando detalles...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            const result = await academicoService.getEvaluacionDocenteDetalle(evalId);
            if (result.success) {
                const ev = result.evaluacion;
                
                const criteriosTexto = [
                    'Diseña instrumentos de evaluación para la revisión del producto o actividad sumativa',
                    'Aplica instrumentos de evaluación a cada una de las actividades sumativas',
                    'Explica los criterios de evaluación e indicadores de desempeño a los estudiantes',
                    'Aplica los criterios de evaluación e indicadores de desempeño de los instrumentos diseñados',
                    'Los instrumentos usados evalúan los indicadores de desempeño de la competencia del perfil de egreso',
                    'Los instrumentos empleados evalúan de forma integral la competencia del perfil de egreso',
                    'Evidencia los resultados de todas las evaluaciones con los criterios e indicadores de desempeño'
                ];

                let criteriosHtml = '<table class="evaluation-table" style="width:100%; border-collapse: collapse; margin-top:15px;">' +
                    '<thead><tr style="background:#f3f4f6;">' +
                    '<th style="border:1px solid #ddd; padding:8px;">Criterio</th>' +
                    '<th style="border:1px solid #ddd; padding:8px;">Calificación</th>' +
                    '<th style="border:1px solid #ddd; padding:8px;">Observaciones</th></tr></thead><tbody>';

                for (let i = 1; i <= 7; i++) {
                    criteriosHtml += `<tr>
                        <td style="border:1px solid #ddd; padding:8px; font-size:0.9rem;">${criteriosTexto[i-1]}</td>
                        <td style="border:1px solid #ddd; padding:8px; text-align:center; font-weight:bold;">${ev[`criterio${i}_calificacion`]}</td>
                        <td style="border:1px solid #ddd; padding:8px;">${ev[`criterio${i}_observaciones`] || '-'}</td>
                    </tr>`;
                }
                criteriosHtml += '</tbody></table>';

                Swal.fire({
                    title: 'Detalles de Evaluación',
                    html: `
                        <div style="text-align:left; font-size:0.9rem;">
                            <p><strong>Docente:</strong> ${ev.docente_nombre}</p>
                            <p><strong>Materia:</strong> ${ev.unidad_curricular}</p>
                            <p><strong>Sección:</strong> ${ev.seccion_codigo} (${ev.carrera_nombre} - Semestre ${ev.semestre})</p>
                            <p><strong>Fecha:</strong> ${new Date(ev.fecha_evaluacion).toLocaleDateString('es-ES')}</p>
                            <hr/>
                            ${criteriosHtml}
                            <div style="margin-top:15px;">
                                <strong>Sugerencias:</strong><br/>
                                <p style="background:#f9fafb; padding:10px; border-radius:5px; border:1px solid #e5e7eb;">${ev.sugerencias || 'Sin sugerencias'}</p>
                            </div>
                        </div>
                    `,
                    width: '80%',
                    showCloseButton: true,
                    confirmButtonText: 'Cerrar'
                });
            }
        } catch {
            Swal.fire('Error', 'No se pudo visualizar la evaluación', 'error');
        }
    };

    const resetForm = () => {
        setFormData({
            unidad_curricular: '',
            semestre: '',
            carrera_codigo: '',
            seccion_id: '',
            sugerencias: '',
            criterios: Array(7).fill().map(() => ({ calificacion: '', observaciones: '' }))
        });
        setPermisosDocente(null);
        setCurrentEvalId(null);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        
        // Validaciones
        if (!formData.unidad_curricular || !formData.seccion_id) {
            return Swal.fire('Atención', 'Seleccione la materia y sección', 'warning');
        }

        const incompletos = formData.criterios.some(c => !c.calificacion);
        if (incompletos) {
            return Swal.fire('Atención', 'Debe calificar todos los criterios', 'warning');
        }

        const payload = {
            docente_cedula: selectedDocente.cedula,
            unidad_curricular: formData.unidad_curricular,
            semestre: parseInt(formData.semestre),
            seccion_id: parseInt(formData.seccion_id),
            carrera_codigo: formData.carrera_codigo,
            sugerencias: formData.sugerencias
        };

        // Agregar criterios al payload
        formData.criterios.forEach((c, idx) => {
            payload[`criterio${idx + 1}_calificacion`] = c.calificacion;
            payload[`criterio${idx + 1}_observaciones`] = c.observaciones;
        });

        try {
            Swal.fire({ title: 'Guardando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            
            let result;
            if (modalMode === 'edit') {
                result = await academicoService.updateEvaluacionDocente(currentEvalId, payload);
            } else {
                result = await academicoService.saveEvaluacionDocente(payload);
            }

            if (result.success) {
                Swal.fire('Éxito', result.message, 'success');
                setModalMode(null);
                loadEvaluaciones();
            } else {
                Swal.fire('Error', result.message || 'Error al procesar', 'error');
            }
        } catch {
            Swal.fire('Error', 'Error de conexión con el servidor', 'error');
        }
    };

    const handleCriterioChange = (index, calif, obs) => {
        const newCriterios = [...formData.criterios];
        if (calif !== undefined) newCriterios[index].calificacion = calif;
        if (obs !== undefined) newCriterios[index].observaciones = obs;
        setFormData({ ...formData, criterios: newCriterios });
    };

    if (!user) return null;

    const criteriosTexto = [
        'Diseña instrumentos de evaluación para la revisión del producto o actividad sumativa en este corte',
        'Aplica instrumentos de evaluación a cada una de las actividades sumativas realizadas a los alumnos en este corte',
        'Explica los criterios de evaluación e indicadores de desempeño a los estudiantes en este corte',
        'Aplica los criterios de evaluación e indicadores de desempeño de los instrumentos diseñados a cada una de las actividades sumativas en este corte',
        'Los instrumentos usados en este corte evalúan los indicadores de desempeño de la competencia del perfil de egreso',
        'Los instrumentos empleados para cada actividad sumativa evalúan de forma integral la competencia del perfil de egreso',
        'Evidencia los resultados de todas las evaluaciones con los criterios e indicadores de desempeño de los instrumentos de evaluación diseñados'
    ];

    return (
        <main className="main-content">
            <Menu user={user} />
            <div className="content-wrapper" style={{ width: '100%' }}>
                <Header title="Evaluación de Docentes" user={user} onLogout={() => navigate('/login')} />
                
                <div style={{ padding: '30px' }}>
                    <div className="view-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="search-box" style={{ position: 'relative', width: '300px' }}>
                            <i className="fas fa-search" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
                            <input 
                                type="text" 
                                placeholder="Buscar docente por nombre o cédula..." 
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                style={{ width: '100%', padding: '12px 15px 12px 45px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.9rem' }}
                            />
                        </div>
                    </div>

                    <div className="card" style={{ borderRadius: '15px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', background: '#fff' }}>
                        <div className="table-container" style={{ overflowX: 'auto' }}>
                            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                    <tr>
                                        <th style={{ padding: '15px', textAlign: 'left', color: '#64748b', fontWeight: 'bold' }}>Docente</th>
                                        <th style={{ padding: '15px', textAlign: 'left', color: '#64748b', fontWeight: 'bold' }}>Estado</th>
                                        <th style={{ padding: '15px', textAlign: 'left', color: '#64748b', fontWeight: 'bold' }}>Última Evaluación</th>
                                        <th style={{ padding: '15px', textAlign: 'center', color: '#64748b', fontWeight: 'bold' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="4" style={{ textAlign: 'center', padding: '30px' }}>Cargando datos...</td></tr>
                                    ) : paginatedEvaluaciones.length > 0 ? (
                                        paginatedEvaluaciones.map((evalu) => (
                                            <tr key={evalu.cedula} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '15px' }}>
                                                    <div style={{ fontWeight: '600', color: '#1e293b' }}>{evalu.docente_nombre}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{evalu.cedula}</div>
                                                    {evalu.especializacion && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{evalu.especializacion}</div>}
                                                </td>
                                                <td style={{ padding: '15px' }}>
                                                    <span style={{ 
                                                        padding: '5px 12px', 
                                                        borderRadius: '20px', 
                                                        fontSize: '0.8rem', 
                                                        fontWeight: '600',
                                                        background: evalu.estado === 'Evaluado' ? '#dcfce7' : '#fef9c3',
                                                        color: evalu.estado === 'Evaluado' ? '#166534' : '#854d0e'
                                                    }}>
                                                        {evalu.estado}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '15px' }}>
                                                    {evalu.fecha_evaluacion ? (
                                                        <div>
                                                            <div style={{ fontSize: '0.9rem' }}>{new Date(evalu.fecha_evaluacion).toLocaleDateString('es-ES')}</div>
                                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{evalu.rubrica_nombre}</div>
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Sin evaluar</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '15px', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                        {evalu.estado === 'Evaluado' ? (
                                                            <>
                                                                <button onClick={() => openEditModal(evalu)} className="btns" style={{ background: '#3b82f6', color: 'white', padding: '8px 15px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>
                                                                    <i className="fas fa-edit"></i> Editar
                                                                </button>
                                                                <button onClick={() => openViewModal(evalu.evaluacion_id)} className="btns" style={{ background: '#94a3b8', color: 'white', padding: '8px 15px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>
                                                                    <i className="fas fa-eye"></i> Ver
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button onClick={() => openCreateModal(evalu)} className="btns" style={{ background: '#10b981', color: 'white', padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
                                                                <i className="fas fa-clipboard-check"></i> Evaluar
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="4" style={{ textAlign: 'center', padding: '30px' }}>No se encontraron docentes para evaluar.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginación */}
                        <div className="pagination-footer" style={{ padding: '15px 25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9' }}>
                            <div className="entries-info" style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                Mostrando {filteredEvaluaciones.length > 0 ? (currentPage - 1) * entriesPerPage + 1 : 0} a {Math.min(currentPage * entriesPerPage, filteredEvaluaciones.length)} de {filteredEvaluaciones.length} resultados
                            </div>
                            <div className="pagination-controls" style={{ display: 'flex', gap: '5px' }}>
                                <button 
                                    disabled={currentPage === 1} 
                                    onClick={() => setCurrentPage(p => p - 1)}
                                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
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
                                    disabled={currentPage === totalPages || totalPages === 0} 
                                    onClick={() => setCurrentPage(p => p + 1)}
                                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: (currentPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer' }}
                                >
                                    <i className="fas fa-chevron-right"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MODAL DE EVALUACIÓN */}
                {modalMode && (
                    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                        <div className="modal-content" style={{ background: 'white', borderRadius: '15px', width: '90%', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                            <div className="modal-header" style={{ padding: '20px 30px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                                <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1e3a8a' }}>
                                    {modalMode === 'edit' ? 'Editar Evaluación Docente' : 'Nueva Evaluación Docente'}
                                </h2>
                                <button onClick={() => setModalMode(null)} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
                            </div>

                            <form onSubmit={handleFormSubmit} style={{ padding: '30px' }}>
                                <div style={{ marginBottom: '25px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>Docente</label>
                                        <input type="text" value={selectedDocente?.docente_nombre} readOnly className="form-input" style={{ background: '#f1f5f9' }} />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>Unidad Curricular *</label>
                                        <select 
                                            className="form-select" 
                                            value={formData.unidad_curricular} 
                                            onChange={(e) => setFormData({...formData, unidad_curricular: e.target.value})}
                                            required
                                        >
                                            <option value="">Seleccione materia</option>
                                            {permisosDocente?.materias && Object.entries(permisosDocente.materias).map(([codigo, nombre]) => (
                                                <option key={codigo} value={nombre}>{nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>Semestre *</label>
                                        <select 
                                            className="form-select" 
                                            value={formData.semestre} 
                                            onChange={(e) => setFormData({...formData, semestre: e.target.value})}
                                            required
                                        >
                                            <option value="">Seleccione semestre</option>
                                            {permisosDocente?.semestres?.map(s => (
                                                <option key={s} value={s}>Semestre {s}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>Carrera *</label>
                                        <select 
                                            className="form-select" 
                                            value={formData.carrera_codigo} 
                                            onChange={(e) => setFormData({...formData, carrera_codigo: e.target.value})}
                                            required
                                        >
                                            <option value="">Seleccione carrera</option>
                                            {permisosDocente?.carreras && Object.entries(permisosDocente.carreras).map(([codigo, nombre]) => (
                                                <option key={codigo} value={codigo}>{nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>Sección *</label>
                                        <select 
                                            className="form-select" 
                                            value={formData.seccion_id} 
                                            onChange={(e) => setFormData({...formData, seccion_id: e.target.value})}
                                            required
                                        >
                                            <option value="">Seleccione sección</option>
                                            {permisosDocente?.secciones && Object.entries(permisosDocente.secciones).map(([id, nombre]) => (
                                                <option key={id} value={id}>{nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="table-container" style={{ marginBottom: '30px' }}>
                                    <h3 style={{ fontSize: '1rem', color: '#1e3a8a', marginBottom: '15px' }}>4. Instrumentos de Evaluación en este Corte</h3>
                                    <table className="evaluation-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: '#f8fafc' }}>
                                                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e2e8f0', width: '50%' }}>Criterio</th>
                                                <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #e2e8f0' }}>S</th>
                                                <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #e2e8f0' }}>CS / AV</th>
                                                <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #e2e8f0' }}>N</th>
                                                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e2e8f0' }}>Observaciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {criteriosTexto.map((texto, i) => (
                                                <tr key={i}>
                                                    <td style={{ padding: '12px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>{texto}</td>
                                                    <td style={{ padding: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                                                        <input 
                                                            type="radio" 
                                                            name={`crit_${i}`} 
                                                            checked={formData.criterios[i].calificacion === 'S'} 
                                                            onChange={() => handleCriterioChange(i, 'S', null)}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                                                        <select 
                                                            className="small-select" 
                                                            style={{ padding: '4px', borderRadius: '4px', border: '1px solid #ddd' }}
                                                            value={['CS', 'AV'].includes(formData.criterios[i].calificacion) ? formData.criterios[i].calificacion : ''}
                                                            onChange={(e) => handleCriterioChange(i, e.target.value, null)}
                                                        >
                                                            <option value="">-</option>
                                                            <option value="CS">CS</option>
                                                            <option value="AV">AV</option>
                                                        </select>
                                                    </td>
                                                    <td style={{ padding: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                                                        <input 
                                                            type="radio" 
                                                            name={`crit_${i}`} 
                                                            checked={formData.criterios[i].calificacion === 'N'} 
                                                            onChange={() => handleCriterioChange(i, 'N', null)}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '12px', border: '1px solid #e2e8f0' }}>
                                                        <input 
                                                            type="text" 
                                                            className="form-input" 
                                                            placeholder="Obs..." 
                                                            style={{ padding: '8px', fontSize: '0.8rem' }}
                                                            value={formData.criterios[i].observaciones}
                                                            onChange={(e) => handleCriterioChange(i, undefined, e.target.value)}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="form-group" style={{ marginBottom: '30px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>Sugerencias Finales</label>
                                    <textarea 
                                        className="form-textarea" 
                                        rows="3" 
                                        placeholder="Ingrese sugerencias para mejorar el desempeño..."
                                        value={formData.sugerencias}
                                        onChange={(e) => setFormData({...formData, sugerencias: e.target.value})}
                                    ></textarea>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
                                    <button type="button" onClick={() => setModalMode(null)} className="btns" style={{ background: '#94a3b8', color: 'white', padding: '10px 25px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btns" style={{ background: '#1e3a8a', color: 'white', padding: '10px 40px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                                        <i className="fas fa-save" style={{ marginRight: '8px' }}></i>
                                        {modalMode === 'edit' ? 'Actualizar Evaluación' : 'Guardar Evaluación'}
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