import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { rubricasService } from '../services/rubricas.service';
import { teacherRubricasService } from '../services/teacherRubricas.service';
import { imprimirRubricaFormal } from '../utils/printRubrica';

export default function ModalReutilizarRubrica({
    isOpen,
    onClose,
    evaluacionId,
    onDuplicarRubrica,
    role = 'teacher' // 'teacher' | 'admin'
}) {
    const [rubricas, setRubricas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Teacher mode: 'mis' vs 'materias'
    const [modo, setModo] = useState('mis');

    // Admin mode: filtro de profesor
    const [professorFilter, setProfessorFilter] = useState('');
    const navigate = useNavigate();

    const debounceRef = useRef(null);
    const isVinculandoRef = useRef(false);

    const isTeacher = role === 'teacher';
    const service = isTeacher ? teacherRubricasService : rubricasService;

    const fetchRubricas = useCallback(async ({
        page = 1,
        search = '',
        limit = itemsPerPage,
        modoParam = modo
    } = {}) => {
        try {
            setLoading(true);
            const params = {
                search,
                page,
                limit: limit === 'todos' ? 9999 : Number(limit)
            };
            if (isTeacher) {
                params.modo = modoParam;
            }

            const data = await service.getRubricas(params);
            setRubricas(data.rubricas || []);
            setTotal(data.total || 0);
            setTotalPages(data.totalPages || 1);
        } catch (error) {
            console.error('Error fetching rubricas for modal:', error);
            Swal.fire('Error', 'No se pudieron cargar las rúbricas', 'error');
        } finally {
            setLoading(false);
        }
    }, [isTeacher, itemsPerPage, modo, service]);

    // Initial load when modal opens
    useEffect(() => {
        if (isOpen) {
            setCurrentPage(1);
            setSearchTerm('');
            setProfessorFilter('');
            setModo('mis');
            fetchRubricas({ page: 1, search: '', limit: itemsPerPage, modoParam: 'mis' });
        }
    }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

    // Fetch on page/limit/modo change (when modal is open)
    useEffect(() => {
        if (!isOpen) return;
        fetchRubricas({ page: currentPage, search: searchTerm, limit: itemsPerPage, modoParam: modo });
    }, [currentPage, itemsPerPage, modo]); // eslint-disable-line react-hooks/exhaustive-deps

    // Profesores únicos para admin
    const profesoresUnicos = useMemo(() => {
        if (isTeacher) return [];
        const names = rubricas.map(r => r.docente_nombre);
        return [...new Set(names)].filter(Boolean).sort();
    }, [rubricas, isTeacher]);

    // Rubricas mostradas (filtro local de docente solo para admin en la página actual)
    const rubricasMostradas = useMemo(() => {
        if (isTeacher || !professorFilter) return rubricas;
        return rubricas.filter(r => r.docente_nombre === professorFilter);
    }, [rubricas, professorFilter, isTeacher]);

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearchTerm(val);
        setCurrentPage(1);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetchRubricas({ page: 1, search: val, limit: itemsPerPage, modoParam: modo });
        }, 300);
    };

    const handleModoChange = (nuevoModo) => {
        setModo(nuevoModo);
        setCurrentPage(1);
        setSearchTerm('');
        fetchRubricas({ page: 1, search: '', limit: itemsPerPage, modoParam: nuevoModo });
    };

    const handleVerRubrica = async (id, id_eval) => {
        try {
            Swal.fire({
                title: 'Cargando rúbrica...',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });

            const data = await service.getRubricaDetalle(id, id_eval);
            Swal.close();

            if (data && (data.success || data.rubrica)) {
                const opened = imprimirRubricaFormal(data.rubrica, data.criterios);
                if (!opened) {
                    Swal.fire('Atención', 'Por favor habilite las ventanas emergentes (pop-ups) para ver la rúbrica.', 'warning');
                }
            } else {
                Swal.fire('Error', data.message || 'No se pudo obtener el detalle de la rúbrica', 'error');
            }
        } catch (error) {
            console.error('Error al ver rúbrica:', error);
            Swal.fire('Error', 'No se pudo cargar el detalle de la rúbrica', 'error');
        }
    };

    const handleSeleccionarRubrica = async (rubrica) => {
        if (isVinculandoRef.current) return;

        if (isTeacher) {
            const confirm = await Swal.fire({
                title: '¿Reutilizar esta rúbrica?',
                html: 'Se creará una copia de <b>"' + (rubrica.nombre_rubrica || '') + '"</b> para esta evaluación. Podrás revisar y ajustar los criterios antes de guardarla.',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#10b981',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'Sí, continuar',
                cancelButtonText: 'Cancelar'
            });

            if (!confirm.isConfirmed) return;

            navigate(`/teacher/rubricas/editar/${rubrica.id}/${evaluacionId}?modo=duplicar`);
            onClose();
            return;
        }

        // Admin: se mantiene el flujo de vinculación directa por ahora
        const confirm = await Swal.fire({
            title: '¿Vincular rúbrica a esta evaluación?',
            html: 'Se asignará la rúbrica <b>"' + (rubrica.nombre_rubrica || '') + '"</b> a la evaluación seleccionada.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, vincular',
            cancelButtonText: 'Cancelar'
        });

        if (!confirm.isConfirmed) return;

        if (onDuplicarRubrica) {
            onDuplicarRubrica(rubrica.id, evaluacionId);
        }
        onClose()
    };

    if (!isOpen) return null;

    return (
        <div
            className="modal active"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.65)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '20px'
            }}
        >
            <div
                style={{
                    background: 'white',
                    borderRadius: '16px',
                    width: '95%',
                    maxWidth: '1100px',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    overflow: 'hidden'
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: '20px 25px',
                        background: '#f8fafc',
                        borderBottom: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                            style={{
                                background: '#e0e7ff',
                                width: '40px',
                                height: '40px',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#1e3a8a',
                                fontSize: '1.2rem'
                            }}
                        >
                            <i className="fas fa-sync" />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1e293b', fontWeight: 'bold' }}>
                                Reutilizar Rúbrica Existente
                            </h2>
                            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                Selecciona una rúbrica para asignarla a esta evaluación
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            color: '#94a3b8',
                            lineHeight: 1
                        }}
                    >
                        &times;
                    </button>
                </div>

                {/* Filtros y Buscador */}
                <div style={{ padding: '20px 25px 15px', borderBottom: '1px solid #f1f5f9' }}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '15px'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Mostrar:</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setItemsPerPage(val === 'todos' ? 'todos' : Number(val));
                                    setCurrentPage(1);
                                    fetchRubricas({
                                        page: 1,
                                        search: searchTerm,
                                        limit: val,
                                        modoParam: modo
                                    });
                                }}
                                style={{
                                    padding: '7px 10px',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '0.9rem'
                                }}
                            >
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="20">20</option>
                                <option value="todos">Todos</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', flex: 1, maxWidth: '650px', flexWrap: 'wrap' }}>
                            <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                                <i
                                    className="fas fa-search"
                                    style={{
                                        position: 'absolute',
                                        left: '14px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: '#94a3b8'
                                    }}
                                />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre de rúbrica o evaluación..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    style={{
                                        width: '100%',
                                        padding: '9px 12px 9px 40px',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0',
                                        fontSize: '0.9rem'
                                    }}
                                />
                            </div>

                            {/* Selector de modo para profesor */}
                            {isTeacher && (
                                <select
                                    value={modo}
                                    onChange={(e) => handleModoChange(e.target.value)}
                                    style={{
                                        padding: '9px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0',
                                        fontSize: '0.9rem',
                                        minWidth: '200px'
                                    }}
                                >
                                    <option value="mis">Mis rúbricas</option>
                                    <option value="materias">Rúbricas de mis materias</option>
                                </select>
                            )}

                            {/* Selector de profesor para admin */}
                            {!isTeacher && (
                                <select
                                    value={professorFilter}
                                    onChange={(e) => {
                                        setProfessorFilter(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    style={{
                                        padding: '9px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0',
                                        fontSize: '0.9rem',
                                        minWidth: '180px'
                                    }}
                                >
                                    <option value="">Todos los profesores</option>
                                    {profesoresUnicos.map((p) => (
                                        <option key={p} value={p}>
                                            {p}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabla de Rúbricas */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0 25px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 1 }}>
                            <tr>
                                <th style={{ padding: '12px 15px', textAlign: 'left', color: '#64748b', fontSize: '0.85rem' }}>Rúbrica</th>
                                <th style={{ padding: '12px 15px', textAlign: 'left', color: '#64748b', fontSize: '0.85rem' }}>Evaluación origen</th>
                                <th style={{ padding: '12px 15px', textAlign: 'left', color: '#64748b', fontSize: '0.85rem' }}>Docente</th>
                                <th style={{ padding: '12px 15px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>Estado</th>
                                <th style={{ padding: '12px 15px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                        <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px', color: '#3b82f6' }} />
                                        Cargando rúbricas disponibles...
                                    </td>
                                </tr>
                            ) : rubricasMostradas.length > 0 ? (
                                rubricasMostradas.map((r) => (
                                    <tr key={`${r.id}-${r.id_evaluacion}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '12px 15px' }}>
                                            <div style={{ fontWeight: '600', color: '#1e293b' }}>{r.nombre_rubrica}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                Creada: {r.fecha_creacion ? new Date(r.fecha_creacion).toLocaleDateString('es-ES') : 'N/A'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 15px' }}>
                                            <div style={{ fontSize: '0.85rem', color: '#334155' }}>{r.contenido}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                {r.carrera_nombre} - {r.materia_nombre} {r.seccion_letra ? `Sec. ${r.seccion_letra}` : ''}
                                            </div>
                                        </td>
                                        <td style={{ padding: '12px 15px' }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: '500', color: '#334155' }}>{r.docente_nombre}</div>
                                        </td>
                                        <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                                            <span
                                                style={{
                                                    padding: '3px 8px',
                                                    borderRadius: '10px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600',
                                                    background:
                                                        r.estado === 'Aprobado' || r.estado === 'Activa'
                                                            ? '#e2f5ec'
                                                            : r.estado === 'Rechazado' || r.estado === 'Inactivo'
                                                                ? '#fee2e2'
                                                                : '#fef3c7',
                                                    color:
                                                        r.estado === 'Aprobado' || r.estado === 'Activa'
                                                            ? '#10b981'
                                                            : r.estado === 'Rechazado' || r.estado === 'Inactivo'
                                                                ? '#ef4444'
                                                                : '#d97706'
                                                }}
                                            >
                                                {r.estado || 'En Revision'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleVerRubrica(r.id, r.id_evaluacion)}
                                                    className="btns"
                                                    style={{
                                                        background: '#94a3b8',
                                                        color: 'white',
                                                        padding: '7px 12px',
                                                        borderRadius: '6px',
                                                        fontSize: '0.8rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '5px',
                                                        border: 'none',
                                                        cursor: 'pointer'
                                                    }}
                                                    title="Ver Rúbrica"
                                                >
                                                    <i className="fas fa-eye" /> Ver
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSeleccionarRubrica(r)}
                                                    className="btns"
                                                    style={{
                                                        background: '#10b981',
                                                        color: 'white',
                                                        padding: '7px 14px',
                                                        borderRadius: '6px',
                                                        fontSize: '0.8rem',
                                                        fontWeight: '600',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '5px',
                                                        border: 'none',
                                                        cursor: 'pointer'
                                                    }}
                                                    title="Seleccionar esta rúbrica"
                                                >
                                                    <i className="fas fa-check" /> Seleccionar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                        No se encontraron rúbricas disponibles para reutilizar.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer y Paginación */}
                <div
                    style={{
                        padding: '15px 25px',
                        background: '#f8fafc',
                        borderTop: '1px solid #e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '10px'
                    }}
                >
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        {total > 0
                            ? `Mostrando ${itemsPerPage === 'todos' ? 1 : ((currentPage - 1) * Number(itemsPerPage)) + 1}–${itemsPerPage === 'todos' ? total : Math.min(currentPage * Number(itemsPerPage), total)} de ${total} rúbricas`
                            : '0 rúbricas encontradas'}
                    </span>

                    {itemsPerPage !== 'todos' && totalPages > 1 && (
                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage((p) => p - 1)}
                                style={{
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    border: '1px solid #e2e8f0',
                                    background: currentPage === 1 ? '#f1f5f9' : 'white',
                                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                                }}
                            >
                                <i className="fas fa-chevron-left" />
                            </button>
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => setCurrentPage(i + 1)}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        border: '1px solid #e2e8f0',
                                        background: currentPage === i + 1 ? '#1e3a8a' : 'white',
                                        color: currentPage === i + 1 ? 'white' : '#1e293b',
                                        cursor: 'pointer',
                                        fontWeight: currentPage === i + 1 ? '600' : 'normal'
                                    }}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage((p) => p + 1)}
                                style={{
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    border: '1px solid #e2e8f0',
                                    background: currentPage === totalPages ? '#f1f5f9' : 'white',
                                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                                }}
                            >
                                <i className="fas fa-chevron-right" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
