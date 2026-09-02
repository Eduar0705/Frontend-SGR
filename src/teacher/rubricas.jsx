import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Menu from '../components/menu';
import Header from '../components/header';
import { teacherRubricasService } from '../services/teacherRubricas.service';
import { imprimirRubricaFormal } from '../utils/printRubrica';
import '../assets/css/home.css';

import { useUI } from '../context/UIContext';

export default function TeacherRubrica() {
    const navigate = useNavigate();
    const { setLoading: setGlobalLoading } = useUI();
    const [user] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    const [rubricas, setRubricas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    // 'mis' = solo rÃºbricas propias | 'materias' = todas las rÃºbricas de mis secciones
    const [modo, setModo] = useState('mis');

    const debounceRef = useRef(null);
    const mountedRef = useRef(false);

    const fetchRubricas = useCallback(async ({ page = 1, search = '', limit = itemsPerPage, modoParam = modo } = {}) => {
        try {
            setLoading(true);
            const data = await teacherRubricasService.getRubricas({
                search,
                page,
                limit,
                modo: modoParam
            });
            setRubricas(data.rubricas);
            setTotal(data.total);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error('Error fetching rubricas:', error);
            Swal.fire('Error', 'Error de conexiÃ³n', 'error');
        } finally {
            setLoading(false);
            setGlobalLoading(false);
        }
    }, [setGlobalLoading, itemsPerPage, modo]);

    // Carga inicial
    useEffect(() => {
        if (!user) { navigate('/login'); return; }
        fetchRubricas({ page: 1, search: '', limit: itemsPerPage, modoParam: modo });
    }, [user, navigate]); // eslint-disable-line react-hooks/exhaustive-deps

    // Fetch unificado cuando cambia pÃ¡gina, lÃ­mite o modo (evita doble fetch en primer render)
    useEffect(() => {
        if (!user) return;
        if (!mountedRef.current) { mountedRef.current = true; return; }
        fetchRubricas({ page: currentPage, search: searchTerm, limit: itemsPerPage, modoParam: modo });
    }, [currentPage, itemsPerPage, modo]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleDelete = async (id, id_eval) => {
        const result = await Swal.fire({
            title: 'Â¿EstÃ¡s seguro de desvincular esta evaluaciÃ³n de su rÃºbrica?',
            text: "DejarÃ¡s de usar esta rÃºbrica en esta evaluaciÃ³n, y tendrÃ¡s que volver a corregir si ya habÃ­as comenzado a evaluar. Recomendamos editarla mejor",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'SÃ­, desvincular',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                const data = await teacherRubricasService.desvincularRubrica(id, id_eval);
                if (data.success) {
                    Swal.fire('Desvinculada', 'La evaluaciÃ³n se desvinculÃ³ de la rÃºbrica.', 'success');
                    fetchRubricas({ page: currentPage, search: searchTerm, limit: itemsPerPage, modoParam: modo });
                } else {
                    Swal.fire('Error', data.message || 'Error al desvincular la rÃºbrica', 'error');
                }
            } catch (error) {
                console.error('Error desvincularRubrica:', error);
                Swal.fire('Error', 'Error de red', 'error');
            }
        }
    };

    const handleEdit = (id, id_eval) => navigate(`/teacher/rubricas/editar/${id}/${id_eval}`);

    const handleView = async (id, id_eval) => {
        try {
            Swal.fire({ title: 'Cargando rÃºbrica...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            const data = await teacherRubricasService.getRubricaDetalle(id, id_eval);
            if (data.success) {
                Swal.close();
                const opened = imprimirRubricaFormal(data.rubrica, data.criterios);
                if (!opened) Swal.fire('AtenciÃ³n', 'Por favor habilite las ventanas emergentes (pop-ups) para ver la rÃºbrica.', 'warning');
            } else {
                Swal.fire('Error', data.message || 'Error al obtener rÃºbrica', 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Error de red', 'error');
            console.error(error);
        }
    };

    const handleModoChange = (nuevoModo) => {
        setModo(nuevoModo);
        setCurrentPage(1);
        setSearchTerm('');
        fetchRubricas({ page: 1, search: '', limit: itemsPerPage, modoParam: nuevoModo });
    };

    if (!user) return null;

    return (
        <main className="main-content">
            <Menu user={user} />
            <div className="content-wrapper">
                <Header title="Rúbricas por Evaluación" user={user} onLogout={() => navigate('/login')} />
                <div className="view active" style={{ padding: '20px' }}>
                    <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Mostrar:</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    const newLimit = Number(e.target.value);
                                    setItemsPerPage(newLimit);
                                    setCurrentPage(1);
                                    fetchRubricas({ page: 1, search: searchTerm, limit: newLimit, modoParam: modo });
                                }}
                                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                            >
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', flex: 1, maxWidth: '700px', flexWrap: 'wrap' }}>
                            <div className="search-box" style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                                <i className="fa fa-search" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#666' }}></i>
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre de rúbrica o evaluación..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setSearchTerm(val);
                                        setCurrentPage(1);
                                        clearTimeout(debounceRef.current);
                                        debounceRef.current = setTimeout(() => {
                                            fetchRubricas({ page: 1, search: val, limit: itemsPerPage, modoParam: modo });
                                        }, 300);
                                    }}
                                    style={{ width: '100%', padding: '10px 15px 10px 45px', borderRadius: '10px', border: '1px solid #e2e8f0' }}
                                />
                            </div>
                            {/* Selector de modo */}
                            <select
                                value={modo}
                                onChange={(e) => handleModoChange(e.target.value)}
                                style={{ padding: '10px 15px', borderRadius: '10px', border: '1px solid #e2e8f0', minWidth: '210px' }}
                            >
                                <option value="mis">Mis rúbricas</option>
                                <option value="materias">Rúbricas de mis materias</option>
                            </select>
                            <button
                                onClick={() => navigate('/teacher/crear-rubricas')}
                                className="btns"
                                style={{ background: '#1e3a8a', color: 'white', padding: '10px 25px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}
                            >
                                <i className="fas fa-plus"></i> Nueva Rúbrica
                            </button>
                        </div>
                    </div>

                    <div className="table-container" style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
                        {loading ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Cargando rÃºbricas...</div>
                        ) : (
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
                                    {rubricas.length > 0 ? rubricas.map(rubrica => (
                                        <tr key={`${rubrica.id}-${rubrica.id_evaluacion}`} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '12px' }}>
                                                <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{rubrica.nombre_rubrica}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Creada el: {new Date(rubrica.fecha_creacion).toLocaleDateString('es-ES')}</div>
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                <div style={{ fontSize: '0.9rem' }}>{rubrica.contenido}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{rubrica.carrera_nombre} - {rubrica.materia_nombre} Sec. {rubrica.seccion_letra}</div>
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                <div style={{ fontSize: '0.9rem' }}>{rubrica.docente_nombre}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>el dí­a {rubrica.fecha_evaluacion ? new Date(rubrica.fecha_evaluacion).toLocaleDateString('es-ES') : 'N/A'}</div>
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                <span style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '0.85em',
                                                    background: rubrica.estado === 'Aprobado' || rubrica.estado === 'Activa' ? '#e2f5ec' : rubrica.estado === 'Rechazado' || rubrica.estado === 'Inactivo' ? '#fee2e2' : '#fef3c7',
                                                    color: rubrica.estado === 'Aprobado' || rubrica.estado === 'Activa' ? '#10b981' : rubrica.estado === 'Rechazado' || rubrica.estado === 'Inactivo' ? '#ef4444' : '#d97706'
                                                }}>
                                                    {rubrica.estado || 'En Revision'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                    <button onClick={() => handleView(rubrica.id, rubrica.id_evaluacion)} className="btns" style={{ background: '#94a3b8', color: 'white', padding: '8px', borderRadius: '8px' }} title="Ver">
                                                        <i className="fas fa-eye"></i>
                                                    </button>
                                                    <button onClick={() => handleEdit(rubrica.id, rubrica.id_evaluacion)} className="btns" style={{ background: '#3b82f6', color: 'white', padding: '8px', borderRadius: '8px' }} title="Editar">
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    <button onClick={() => handleDelete(rubrica.id, rubrica.id_evaluacion)} className="btns" style={{ background: '#ef4444', color: 'white', padding: '8px', borderRadius: '8px' }} title="Desvincular">
                                                        <i className="fas fa-chain-broken"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                                {modo === 'materias'
                                                    ? 'No se encontraron rúbricas en tus materias.'
                                                    : 'No se encontraron rúbricas.'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}

                        {!loading && totalPages > 1 && (
                            <div className="pagination" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderTop: '1px solid #eee' }}>
                                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                    Mostrando {((currentPage - 1) * itemsPerPage) + 1}â€“{Math.min(currentPage * itemsPerPage, total)} de {total} entradas
                                </span>
                                <div className="page-numbers" style={{ display: 'flex', gap: '5px' }}>
                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(p => p - 1)}
                                        style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: '4px', background: currentPage === 1 ? '#f5f5f5' : '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                                    >
                                        Anterior
                                    </button>
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i + 1}
                                            onClick={() => setCurrentPage(i + 1)}
                                            style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: '4px', background: currentPage === i + 1 ? '#1e3a8a' : '#fff', color: currentPage === i + 1 ? '#fff' : '#333', cursor: 'pointer' }}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                    <button
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(p => p + 1)}
                                        style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: '4px', background: currentPage === totalPages ? '#f5f5f5' : '#fff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
