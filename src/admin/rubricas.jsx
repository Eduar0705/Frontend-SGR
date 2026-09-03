import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Menu from '../components/menu';
import Header from '../components/header';
import { rubricasService } from '../services/rubricas.service';
import { imprimirRubricaFormal } from '../utils/printRubrica';
import ModalEditarRubrica from '../components/ModalEditarRubrica';
import LoadingSpinner from '../components/LoadingSpinner';
import Swal from 'sweetalert2';
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

    const [rubricas, setRubricas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [professorFilter, setProfessorFilter] = useState('');
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    const debounceRef = useRef(null);
    const [modalMode, setModalMode] = useState(null);
    const [currentRubricaId, setCurrentRubricaId] = useState(null);
    const [auditRubrica, setAuditRubrica] = useState(null);
    const [currentIdEval, setCurrentIdEval] = useState(null);

    const loadInitialData = useCallback(async ({ page = 1, search = '', limit = entriesPerPage } = {}) => {
        try {
            setLoading(true);
            const result = await rubricasService.getRubricas({ search, page, limit: limit === 'todos' ? 9999 : parseInt(limit) });
            setRubricas(result.rubricas);
            setTotal(result.total);
            setTotalPages(result.totalPages);
        } catch {
            Swal.fire('Error', 'No se pudieron cargar las rúbricas', 'error');
        } finally {
            setLoading(false);
            setGlobalLoading(false);
        }
    }, [setGlobalLoading, entriesPerPage]);

    useEffect(() => {
        if (!user) {
            navigate('/login');
        } else {
            loadInitialData({ page: 1, search: '', limit: entriesPerPage });
        }
    }, [periodoActual, user, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

    // Ref para evitar fetch en el primer render (ya lo hace el useEffect de periodoActual)
    const mountedRef = useRef(false);

    // Fetch unificado: se dispara cuando cambia página o límite (pero no en el primer render)
    useEffect(() => {
        if (!user) return;
        if (!mountedRef.current) { mountedRef.current = true; return; }
        loadInitialData({ page: currentPage, search: searchTerm, limit: entriesPerPage });
    }, [currentPage, entriesPerPage]); // eslint-disable-line react-hooks/exhaustive-deps

    // Profesores únicos calculados desde los registros actuales de la página
    const profesoresUnicos = useMemo(() => {
        const names = rubricas.map(r => r.docente_nombre);
        return [...new Set(names)].filter(Boolean).sort();
    }, [rubricas]);

    // Filtro de profesor sigue siendo en frontend sobre la página actual
    const paginatedRubricas = useMemo(() => {
        if (!professorFilter) return rubricas;
        return rubricas.filter(r => r.docente_nombre === professorFilter);
    }, [rubricas, professorFilter]);

    const handleVerRubrica = async (id, id_eval) => {
        try {
            Swal.fire({ title: 'Cargando rúbrica...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            const data = await rubricasService.getRubricaDetalle(id, id_eval);
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
    // Apertura del Modal de Edición
    const handleEditRubrica = (id, id_eval) => {
        setCurrentRubricaId(id);
        setCurrentIdEval(id_eval);
        setModalMode('edit');
    };
    const handleOpenAuditModal = (rubrica) => {
        setAuditRubrica(rubrica);
        setModalMode('audit');
    };

    const handleAuditarAccion = async (nuevoEstado) => {
        if (!auditRubrica) return;
        try {
            Swal.fire({ title: 'Actualizando estado...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            const res = await rubricasService.auditarRubrica(auditRubrica.id, auditRubrica.id_evaluacion, nuevoEstado);
            Swal.close();
            if (res.success) {
                Swal.fire('Éxito', res.message || `Rúbrica ${nuevoEstado.toLowerCase()} exitosamente`, 'success');
                setModalMode(null);
                setAuditRubrica(null);
                loadInitialData({ page: currentPage, search: searchTerm, limit: entriesPerPage });
            } else {
                Swal.fire('Error', res.message || 'No se pudo actualizar el estado', 'error');
            }
        } catch (error) {
            Swal.close();
            Swal.fire('Error', error.message || 'Error al procesar la auditoría', 'error');
        }
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
                    loadInitialData({ page: currentPage, search: searchTerm, limit: entriesPerPage });
                }
            } catch {
                Swal.fire('Error', 'No se pudo eliminar', 'error');
            }
        }
    };
    const handleUnlinkRubrica = async (id, id_eval) => {
        const result = await Swal.fire({
            title: '¿Estás seguro de desvincular esta evaluación de su rúbrica?',
            text: "Se dejará de usar esta rúbrica en esta evaluación, y el docente tendrá que volver a corregir si ya habí­a comenzado a evaluar. Recomendamos más bien solicitar edición.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, desvincular',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                const data = await rubricasService.desvincularRubrica(id, id_eval);
                if (data.success) {
                    Swal.fire('Desvinculada', 'La evaluación se desvinculó de la rúbrica.', 'success');
                    loadInitialData({ page: currentPage, search: searchTerm, limit: entriesPerPage });
                } else {
                    Swal.fire('Error', data.message || 'Error al desvincular la rúbrica', 'error');
                }
            } catch (error) {
                console.error('Error desvincularRubrica:', error);
                Swal.fire('Error', 'Error de red', 'error');
            }
        }
    };
    if (!user) return null;

    return (
        <main className="main-content">
            <Menu user={user} />
            <div className="content-wrapper" style={{ width: '100%' }}>
                <Header title="Rúbricas por evaluación" user={user} onLogout={() => navigate('/login')} />

                <div style={{ padding: '30px' }}>
                    <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', alignItems: 'center', gap: '20px' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Mostrar:</span>
                            <select
                                value={entriesPerPage}
                                onChange={(e) => {
                                    const newLimit = e.target.value;
                                    setEntriesPerPage(newLimit);
                                    setCurrentPage(1);
                                    // Fuerza el fetch inmediato si currentPage ya era 1 (el effect no dispara)
                                    loadInitialData({ page: 1, search: searchTerm, limit: newLimit });
                                }}
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
                                    placeholder="Buscar por nombre de rúbrica o evaluación..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setSearchTerm(val);
                                        setCurrentPage(1);
                                        // Debounce: espera 300ms antes de hacer fetch
                                        clearTimeout(debounceRef.current);
                                        debounceRef.current = setTimeout(() => {
                                            loadInitialData({ page: 1, search: val, limit: entriesPerPage });
                                        }, 300);
                                    }}
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
                                        <th style={{ padding: '15px', textAlign: 'left', color: '#64748b' }}>Rúbrica</th>
                                        <th style={{ padding: '15px', textAlign: 'left', color: '#64748b' }}>Evaluación</th>
                                        <th style={{ padding: '15px', textAlign: 'left', color: '#64748b' }}>Usada por</th>
                                        <th style={{ padding: '15px', textAlign: 'center', color: '#64748b' }}>Estado</th>
                                        <th style={{ padding: '15px', textAlign: 'center', color: '#64748b' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        [1, 2, 3, 4, 5].map(i => (
                                            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '15px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        <span className="skeleton skeleton-text" style={{ width: '70%' }} />
                                                        <span className="skeleton skeleton-text" style={{ width: '40%' }} />
                                                    </div>
                                                </td>
                                                <td style={{ padding: '15px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        <span className="skeleton skeleton-text" style={{ width: '60%' }} />
                                                        <span className="skeleton skeleton-text" style={{ width: '45%' }} />
                                                    </div>
                                                </td>
                                                <td style={{ padding: '15px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        <span className="skeleton skeleton-text" style={{ width: '50%' }} />
                                                        <span className="skeleton skeleton-text" style={{ width: '30%' }} />
                                                    </div>
                                                </td>
                                                <td style={{ padding: '15px', textAlign: 'center' }}>
                                                    <span className="skeleton skeleton-badge" style={{ width: '75px' }} />
                                                </td>
                                                <td style={{ padding: '15px', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                        <span className="skeleton skeleton-button" style={{ width: '32px', height: '32px' }} />
                                                        <span className="skeleton skeleton-button" style={{ width: '32px', height: '32px' }} />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : paginatedRubricas.length > 0 ? (
                                        paginatedRubricas.map((r) => (
                                            <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '15px' }}>
                                                    <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{r.nombre_rubrica}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Creada el: {new Date(r.fecha_creacion).toLocaleDateString('es-ES')}</div>

                                                </td>
                                                <td style={{ padding: '15px' }}>
                                                    <div style={{ fontSize: '0.9rem' }}>{r.contenido}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{r.carrera_nombre} - {r.materia_nombre} Sec. {r.seccion_letra}</div>
                                                </td>
                                                <td style={{ padding: '15px' }}>
                                                    <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>{r.docente_nombre}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>para el dia {new Date(r.fecha_evaluacion).toLocaleDateString('es-ES')}</div>
                                                </td>
                                                <td style={{ padding: '15px', textAlign: 'center' }}>
                                                    <span
                                                        style={{
                                                            padding: '4px 10px',
                                                            borderRadius: '12px',
                                                            fontSize: '0.85em',
                                                            fontWeight: '600',
                                                            background: r.estado === 'Aprobado' || r.estado === 'Activa' ? '#e2f5ec' : r.estado === 'Rechazado' || r.estado === 'Inactivo' ? '#fee2e2' : '#fef3c7',
                                                            color: r.estado === 'Aprobado' || r.estado === 'Activa' ? '#10b981' : r.estado === 'Rechazado' || r.estado === 'Inactivo' ? '#ef4444' : '#d97706'
                                                        }}
                                                    >
                                                        {r.estado || 'En Revision'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '15px', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                                                        <button
                                                            onClick={() => handleOpenAuditModal(r)}
                                                            className="btns"
                                                            style={{
                                                                background: '#10b981',
                                                                color: 'white',
                                                                padding: '8px 12px',
                                                                borderRadius: '8px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                fontSize: '0.85rem',
                                                                fontWeight: '500'
                                                            }}
                                                            title="Auditar Rúbrica"
                                                        >
                                                            <i className="fas fa-file-signature"></i>
                                                        </button>
                                                        <button onClick={() => handleVerRubrica(r.id, r.id_evaluacion)} className="btns" style={{ background: '#44cc6d', color: 'white', padding: '8px', borderRadius: '8px' }} title="Ver">
                                                            <i className="fas fa-eye"></i>
                                                        </button>
                                                        <button onClick={() => handleEditRubrica(r.id, r.id_evaluacion)} className="btns" style={{ background: '#3b82f6', color: 'white', padding: '8px', borderRadius: '8px' }} title="Editar">
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                        <button onClick={() => handleEliminarRubrica(r.id)} className="btns" style={{ background: '#ef4444', color: 'white', padding: '8px', borderRadius: '8px' }} title="Eliminar">
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                        <button onClick={() => handleUnlinkRubrica(r.id, r.id_evaluacion)} className="btns" style={{ background: '#ef9744', color: 'white', padding: '8px', borderRadius: '8px' }} title="Eliminar">
                                                            <i className="fas fa-chain-broken"></i>
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
                <ModalEditarRubrica
                    isOpen={modalMode === 'edit'}
                    onClose={() => setModalMode(null)}
                    rubricaId={currentRubricaId}
                    idEval={currentIdEval}
                    modo="editar"
                    onSaved={() => {
                        setModalMode(null);
                        loadInitialData({ page: currentPage, search: searchTerm, limit: entriesPerPage });
                    }}
                />

                {/* MODAL DE AUDITORÍA */}
                {modalMode === 'audit' && auditRubrica && (
                    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                        <div className="modal-content" style={{ background: 'white', borderRadius: '15px', width: '90%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                            <div className="modal-header" style={{ padding: '20px 25px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderTopLeftRadius: '15px', borderTopRightRadius: '15px' }}>
                                <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <i className="fas fa-file-signature" style={{ color: '#10b981' }}></i> Auditar Rúbrica
                                </h2>
                                <button onClick={() => { setModalMode(null); setAuditRubrica(null); }} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' }}>&times;</button>
                            </div>

                            <div style={{ padding: '25px' }}>
                                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '25px' }}>
                                    <div style={{ marginBottom: '14px' }}>
                                        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block', letterSpacing: '0.5px' }}>Nombre de la Rúbrica</span>
                                        <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1e293b' }}>{auditRubrica.nombre_rubrica}</span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '14px' }}>
                                        <div>
                                            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block', letterSpacing: '0.5px' }}>Evaluación</span>
                                            <span style={{ fontSize: '0.95rem', color: '#334155' }}>{auditRubrica.contenido} ({auditRubrica.porcentaje_evaluacion}%)</span>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block', letterSpacing: '0.5px' }}>Docente</span>
                                            <span style={{ fontSize: '0.95rem', color: '#334155' }}>{auditRubrica.docente_nombre}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        <div>
                                            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block', letterSpacing: '0.5px' }}>Materia y Sección</span>
                                            <span style={{ fontSize: '0.9rem', color: '#334155' }}>{auditRubrica.carrera_nombre} - {auditRubrica.materia_nombre} (Sec. {auditRubrica.seccion_letra})</span>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', display: 'block', letterSpacing: '0.5px' }}>Estado Actual</span>
                                            <span style={{
                                                display: 'inline-block',
                                                marginTop: '4px',
                                                padding: '4px 10px',
                                                borderRadius: '12px',
                                                fontSize: '0.85em',
                                                fontWeight: '600',
                                                background: auditRubrica.estado === 'Aprobado' || auditRubrica.estado === 'Activa' ? '#e2f5ec' : auditRubrica.estado === 'Rechazado' || auditRubrica.estado === 'Inactivo' ? '#fee2e2' : '#fef3c7',
                                                color: auditRubrica.estado === 'Aprobado' || auditRubrica.estado === 'Activa' ? '#10b981' : auditRubrica.estado === 'Rechazado' || auditRubrica.estado === 'Inactivo' ? '#ef4444' : '#d97706'
                                            }}>
                                                {auditRubrica.estado || 'En Revision'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '25px', textAlign: 'center' }}>
                                    <button
                                        type="button"
                                        onClick={() => handleVerRubrica(auditRubrica.id, auditRubrica.id_evaluacion)}
                                        className="btns"
                                        style={{
                                            background: '#3b82f6',
                                            color: 'white',
                                            padding: '10px 22px',
                                            borderRadius: '8px',
                                            fontWeight: '600',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontSize: '0.95rem'
                                        }}
                                    >
                                        <i className="fas fa-eye"></i> Ver Rúbrica
                                    </button>
                                </div>

                                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                                    <button
                                        type="button"
                                        onClick={() => handleAuditarAccion('Aprobado')}
                                        className="btns"
                                        style={{
                                            background: '#10b981',
                                            color: 'white',
                                            padding: '12px 20px',
                                            borderRadius: '8px',
                                            fontWeight: 'bold',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontSize: '0.95rem',
                                            flex: 1,
                                            justifyContent: 'center',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <i className="fas fa-check-circle"></i> Aprobar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleAuditarAccion('Rechazado')}
                                        className="btns"
                                        style={{
                                            background: '#ef4444',
                                            color: 'white',
                                            padding: '12px 20px',
                                            borderRadius: '8px',
                                            fontWeight: 'bold',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontSize: '0.95rem',
                                            flex: 1,
                                            justifyContent: 'center',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <i className="fas fa-times-circle"></i> Rechazar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}