import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Menu from '../components/menu';
import Header from '../components/header';
import Swal from 'sweetalert2';
import periodosService from '../services/periodos.service';
import '../assets/css/home.css';
import '../assets/css/modalConfig.css';
import '../assets/css/periodos.css';

const EMPTY_CORTE = {
    codigo_periodo: '',
    orden: '',
    fecha_inicio: '',
    fecha_fin: ''
};

export default function Periodos() {
    const navigate = useNavigate();
    const [user] = useState(() => {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    });

    // Periodos
    const [periodos, setPeriodos] = useState([]);
    const [loadingPeriodos, setLoadingPeriodos] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // Periodo seleccionado y sus cortes
    const [selectedPeriodo, setSelectedPeriodo] = useState(null);
    const [cortes, setCortes] = useState([]);
    const [loadingCortes, setLoadingCortes] = useState(false);

    // Modal corte
    const [showCorteModal, setShowCorteModal] = useState(false);
    const [editingCorte, setEditingCorte] = useState(null); // null = agregar, object = editar
    const [corteForm, setCorteForm] = useState(EMPTY_CORTE);

    // Auth guard
    useEffect(() => {
        if (!user || user.id_rol !== 1) {
            navigate('/login');
        } else {
            loadPeriodos();
        }
    }, []);

    const loadPeriodos = async () => {
        setLoadingPeriodos(true);
        try {
            const result = await periodosService.getPeriodos();
            if (result.success) {
                const lista = result.data.data || result.data || [];
                setPeriodos(lista);
            }
        } catch (err) {
            console.error('Error cargando periodos:', err);
        } finally {
            setLoadingPeriodos(false);
        }
    };

    const loadCortes = async (codigoPeriodo) => {
        setLoadingCortes(true);
        setCortes([]);
        try {
            const result = await periodosService.getCortesByPeriodo(codigoPeriodo);
            if (result.success) {
                const lista = result.data.cortes || [];
                setCortes(Array.isArray(lista) ? lista : []);
            }
        } catch (err) {
            console.error('Error cargando cortes:', err);
        } finally {
            setLoadingCortes(false);
        }
    };

    const handleSelectPeriodo = (periodo) => {
        setSelectedPeriodo(periodo);
        loadCortes(periodo.codigo);
    };

    // Filtrado y paginación de periodos
    const filteredPeriodos = useMemo(() =>
        periodos.filter(p =>
            p.codigo.toLowerCase().includes(searchTerm.toLowerCase())
        ), [periodos, searchTerm]);

    const totalPages = Math.ceil(filteredPeriodos.length / entriesPerPage);
    const currentEntries = useMemo(() => {
        const last = currentPage * entriesPerPage;
        const first = last - entriesPerPage;
        return filteredPeriodos.slice(first, last);
    }, [filteredPeriodos, currentPage, entriesPerPage]);

    // ────────── CRUD Cortes ──────────

    const validateCorteDates = (form, periodo) => {
        const pInicio = new Date(periodo.fecha_inicio);
        const pFin = new Date(periodo.fecha_fin);
        const cInicio = new Date(form.fecha_inicio);
        const cFin = new Date(form.fecha_fin);

        if (cInicio < pInicio || cFin > pFin) {
            Swal.fire({
                icon: 'error',
                title: 'Fechas inválidas',
                html: `Las fechas del corte deben estar dentro del rango del periodo:<br/>
                       <strong>${periodo.fecha_inicio}</strong> → <strong>${periodo.fecha_fin}</strong>`
            });
            return false;
        }
        if (cInicio > cFin) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'La fecha de inicio no puede ser mayor a la fecha de fin.' });
            return false;
        }

        // Validar que el corte no se solape con otros cortes del mismo periodo
        const cortesAComparar = cortes.filter(c => {
            // Al editar, excluir el corte actual de la comparación
            if (editingCorte) {
                return !(c.codigo_periodo === editingCorte.codigo_periodo && c.orden === editingCorte.orden);
            }
            return true;
        });

        const corteConflicto = cortesAComparar.find(c => {
            const eInicio = new Date(c.fecha_inicio);
            const eFin = new Date(c.fecha_fin);
            // Hay intersección si: cInicio <= eFin && cFin >= eInicio
            return cInicio <= eFin && cFin >= eInicio;
        });

        if (corteConflicto) {
            Swal.fire({
                icon: 'error',
                title: 'Rango solapado',
                html: `Las fechas se solapan con el <strong>Corte #${corteConflicto.orden}</strong>:<br/>
                       <strong>${formatDate(corteConflicto.fecha_inicio)}</strong> → <strong>${formatDate(corteConflicto.fecha_fin)}</strong>`
            });
            return false;
        }

        return true;
    };

    const openAddCorteModal = () => {
        setEditingCorte(null);
        setCorteForm({ ...EMPTY_CORTE, codigo_periodo: selectedPeriodo.codigo });
        setShowCorteModal(true);
    };

    const openEditCorteModal = (corte) => {
        setEditingCorte(corte);
        setCorteForm({
            codigo_periodo: corte.codigo_periodo,
            orden: corte.orden,
            fecha_inicio: corte.fecha_inicio?.split('T')[0] || corte.fecha_inicio,
            fecha_fin: corte.fecha_fin?.split('T')[0] || corte.fecha_fin
        });
        setShowCorteModal(true);
    };

    const handleCorteFormChange = (e) => {
        setCorteForm(f => ({ ...f, [e.target.name]: e.target.value }));
    };

    const handleCorteSubmit = async (e) => {
        e.preventDefault();
        if (!validateCorteDates(corteForm, selectedPeriodo)) return;

        const payload = {
            codigo_periodo: corteForm.codigo_periodo,
            orden: parseInt(corteForm.orden),
            fecha_inicio: corteForm.fecha_inicio,
            fecha_fin: corteForm.fecha_fin
        };

        let result;
        if (editingCorte) {
            result = await periodosService.updateCorte(editingCorte.codigo_periodo, editingCorte.orden, payload);
        } else {
            result = await periodosService.createCorte(payload);
        }

        if (result.success) {
            Swal.fire('Éxito', editingCorte ? 'Corte actualizado correctamente.' : 'Corte agregado correctamente.', 'success');
            setShowCorteModal(false);
            loadCortes(selectedPeriodo.codigo);
        } else {
            Swal.fire('Error', result.mensaje || 'No se pudo guardar el corte.', 'error');
        }
    };

    const handleDeleteCorte = (corte) => {
        Swal.fire({
            title: '¿Eliminar corte?',
            text: `Se eliminará el corte #${corte.orden} del periodo ${corte.codigo_periodo}.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then(async (res) => {
            if (res.isConfirmed) {
                const result = await periodosService.deleteCorte(corte.codigo_periodo, corte.orden);
                if (result.success) {
                    Swal.fire('Eliminado', 'El corte ha sido eliminado.', 'success');
                    loadCortes(selectedPeriodo.codigo);
                } else {
                    Swal.fire('Error', result.mensaje || 'No se pudo eliminar.', 'error');
                }
            }
        });
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return dateStr.split('T')[0];
    };

    if (!user || user.id_rol !== 1) return null;

    return (
        <main className="main-content">
            <Menu user={user} />
            <div className="content-wrapper" style={{ width: '100%' }}>
                <Header title="Periodos Académicos" user={user} onLogout={() => navigate('/login')} />

                <div className="view active" id="periodos" style={{ padding: '20px' }}>
                    <h2 style={{ marginBottom: '20px' }}>Gestión de Periodos Académicos</h2>

                    <div className="periodos-layout">
                        {/* ── Panel Lista de Periodos ── */}
                        <div className="periodos-panel-left">
                            <div className="card">
                                <div className="card-header">
                                    <span className="card-title">
                                        <i className="fas fa-calendar-alt" style={{ marginRight: '8px', color: 'var(--color-primary)' }}></i>
                                        Periodos
                                    </span>
                                </div>
                                <div className="card-content" style={{ padding: '16px' }}>
                                    {/* Búsqueda y entradas */}
                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                                            <span>Mostrar:</span>
                                            <select
                                                className="entries-select"
                                                value={entriesPerPage}
                                                onChange={e => { setEntriesPerPage(e.target.value === 'todos' ? periodos.length : parseInt(e.target.value)); setCurrentPage(1); }}
                                            >
                                                <option value="5">5</option>
                                                <option value="10">10</option>
                                                <option value="20">20</option>
                                                <option value="todos">Todos</option>
                                            </select>
                                        </div>
                                        <div className="search-box" style={{ flex: '1', minWidth: '140px' }}>
                                            <i className="fa fa-search"></i>
                                            <input
                                                type="text"
                                                placeholder="Buscar periodo..."
                                                value={searchTerm}
                                                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                            />
                                        </div>
                                    </div>

                                    {/* Tabla periodos */}
                                    <div className="table-container" style={{ overflowX: 'auto' }}>
                                        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead style={{ background: '#f8fafc' }}>
                                                <tr>
                                                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px' }}>Código</th>
                                                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px' }}>Inicio</th>
                                                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px' }}>Fin</th>
                                                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px' }}>Estado</th>
                                                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px' }}>Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {loadingPeriodos ? (
                                                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-secondary)' }}>Cargando periodos...</td></tr>
                                                ) : currentEntries.length === 0 ? (
                                                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-secondary)' }}>No se encontraron periodos.</td></tr>
                                                ) : currentEntries.map(p => (
                                                    <tr
                                                        key={p.codigo}
                                                        className={`periodo-row ${selectedPeriodo?.codigo === p.codigo ? 'periodo-row-active' : ''}`}
                                                        onClick={() => handleSelectPeriodo(p)}
                                                        style={{ borderTop: '1px solid #eee', cursor: 'pointer' }}
                                                    >
                                                        <td style={{ padding: '12px', fontWeight: '600', color: 'var(--color-primary)' }}>{p.codigo}</td>
                                                        <td style={{ padding: '12px', fontSize: '13px' }}>{formatDate(p.fecha_inicio)}</td>
                                                        <td style={{ padding: '12px', fontSize: '13px' }}>{formatDate(p.fecha_fin)}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                                            <span className={`periodo-badge ${p.activo ? 'badge-activo' : 'badge-inactivo'}`}>
                                                                {p.activo ? 'Activo' : 'Inactivo'}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                                            <div className="corte-actions">
                                                                <button
                                                                    className="btns btn-view"
                                                                    title="Ver cortes"
                                                                    onClick={e => { e.stopPropagation(); handleSelectPeriodo(p); }}
                                                                    style={{ padding: '6px 10px', fontSize: '12px' }}
                                                                >
                                                                    <i className="fa fa-eye"></i>
                                                                </button>
                                                                {!p.modificable ? (
                                                                <button
                                                                    className="btns btn-delete"
                                                                    title="Eliminar periodo"
                                                                    onClick={e => { e.stopPropagation() }}
                                                                    style={{ padding: '6px 10px', fontSize: '12px' }}
                                                                >
                                                                    <i className="fa fa-trash"></i>
                                                                </button>
                                                                ) : null}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Paginación */}
                                    {totalPages > 1 && (
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '16px' }}>
                                            <button
                                                className="pagination-btn"
                                                disabled={currentPage === 1}
                                                onClick={() => setCurrentPage(p => p - 1)}
                                                style={{ opacity: currentPage === 1 ? 0.4 : 1 }}
                                            >
                                                <i className="fa fa-chevron-left"></i>
                                            </button>
                                            {[...Array(totalPages)].map((_, i) => (
                                                <button
                                                    key={i}
                                                    className="pagination-btn"
                                                    onClick={() => setCurrentPage(i + 1)}
                                                    style={{ background: currentPage === i + 1 ? 'var(--color-primary)' : '#fff', color: currentPage === i + 1 ? '#fff' : 'var(--color-text)' }}
                                                >
                                                    {i + 1}
                                                </button>
                                            ))}
                                            <button
                                                className="pagination-btn"
                                                disabled={currentPage === totalPages}
                                                onClick={() => setCurrentPage(p => p + 1)}
                                                style={{ opacity: currentPage === totalPages ? 0.4 : 1 }}
                                            >
                                                <i className="fa fa-chevron-right"></i>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── Panel Cortes ── */}
                        <div className="periodos-panel-right">
                            {!selectedPeriodo ? (
                                <div className="card periodos-empty-state">
                                    <i className="fas fa-hand-pointer periodos-empty-icon"></i>
                                    <p>Selecciona un periodo para ver y gestionar sus cortes.</p>
                                </div>
                            ) : (
                                <div className="card">
                                    <div className="card-header">
                                        <div>
                                            <span className="card-title">
                                                <i className="fas fa-cut" style={{ marginRight: '8px', color: 'var(--color-primary)' }}></i>
                                                Cortes — {selectedPeriodo.codigo}
                                            </span>
                                            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                                                Rango: {formatDate(selectedPeriodo.fecha_inicio)} → {formatDate(selectedPeriodo.fecha_fin)}
                                            </div>
                                        </div>
                                        <button
                                            className="btns btn-abrir-modal"
                                            onClick={openAddCorteModal}
                                            style={{ background: '#3b82f6', color: '#fff', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', fontSize: '13px' }}
                                        >
                                            <i className="fa fa-plus"></i>
                                            Agregar Corte
                                        </button>
                                    </div>
                                    <div className="card-content" style={{ padding: '16px' }}>
                                        {loadingCortes ? (
                                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
                                                <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', marginBottom: '10px' }}></i>
                                                <p>Cargando cortes...</p>
                                            </div>
                                        ) : cortes.length === 0 ? (
                                            <div className="periodos-empty-state" style={{ padding: '40px 20px' }}>
                                                <i className="fas fa-inbox periodos-empty-icon" style={{ fontSize: '36px' }}></i>
                                                <p>Este periodo no tiene cortes aún.</p>
                                                <button
                                                    onClick={openAddCorteModal}
                                                    style={{ marginTop: '12px', background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
                                                >
                                                    <i className="fa fa-plus" style={{ marginRight: '6px' }}></i>
                                                    Agregar primer corte
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="cortes-list">
                                                {cortes.map((corte, idx) => (
                                                    <div key={`${corte.codigo_periodo}-${corte.orden}`} className="corte-card">
                                                        <div className="corte-orden">
                                                            <span>{corte.orden}</span>
                                                        </div>
                                                        <div className="corte-info">
                                                            <div className="corte-titulo">Corte #{corte.orden}</div>
                                                            <div className="corte-fechas">
                                                                <span><i className="fa fa-calendar-check" style={{ marginRight: '4px', color: 'var(--color-success)' }}></i>{formatDate(corte.fecha_inicio)}</span>
                                                                <span className="corte-flecha">→</span>
                                                                <span><i className="fa fa-calendar-times" style={{ marginRight: '4px', color: 'var(--color-danger)' }}></i>{formatDate(corte.fecha_fin)}</span>
                                                            </div>
                                                        </div>
                                                        <div className="corte-actions">
                                                            <button className="btns btn-edit" title="Editar" onClick={() => openEditCorteModal(corte)}>
                                                                <i className="fa fa-edit"></i>
                                                            </button>
                                                            {corte.modificable ? null :
                                                                (
                                                                    <button className="btns btn-delete" title="Eliminar" onClick={() => handleDeleteCorte(corte)}>
                                                                        <i className="fa fa-trash"></i>
                                                                    </button>
                                                                )
                                                            }
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Modal Agregar / Editar Corte ── */}
            {showCorteModal && (
                <div className="modal-add-usuarios active">
                    <div className="modal-content">
                        <span className="close-btn" onClick={() => setShowCorteModal(false)}>&times;</span>
                        <h2>{editingCorte ? 'Editar Corte' : 'Agregar Corte'}</h2>
                        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
                            Periodo: <strong>{selectedPeriodo?.codigo}</strong> &nbsp;|&nbsp;
                            Rango válido: <strong>{formatDate(selectedPeriodo?.fecha_inicio)}</strong> → <strong>{formatDate(selectedPeriodo?.fecha_fin)}</strong>
                        </p>
                        <form onSubmit={handleCorteSubmit}>
                            <div className="form-group">
                                <label>Orden:</label>
                                <input
                                    type="number"
                                    name="orden"
                                    value={corteForm.orden}
                                    onChange={handleCorteFormChange}
                                    required
                                    min="1"
                                    placeholder="Ej: 1"
                                    disabled={!!editingCorte}
                                    style={{ background: editingCorte ? '#f3f4f6' : undefined }}
                                />
                            </div>
                            <div className="form-group">
                                <label>Fecha Inicio:</label>
                                <input
                                    type="date"
                                    name="fecha_inicio"
                                    value={corteForm.fecha_inicio}
                                    onChange={handleCorteFormChange}
                                    required
                                    min={selectedPeriodo?.fecha_inicio?.split('T')[0]}
                                    max={selectedPeriodo?.fecha_fin?.split('T')[0]}
                                />
                            </div>
                            <div className="form-group">
                                <label>Fecha Fin:</label>
                                <input
                                    type="date"
                                    name="fecha_fin"
                                    value={corteForm.fecha_fin}
                                    onChange={handleCorteFormChange}
                                    required
                                    min={selectedPeriodo?.fecha_inicio?.split('T')[0]}
                                    max={selectedPeriodo?.fecha_fin?.split('T')[0]}
                                />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowCorteModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-submit">{editingCorte ? 'Guardar Cambios' : 'Agregar'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}