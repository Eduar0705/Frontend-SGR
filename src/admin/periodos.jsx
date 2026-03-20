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
    fecha_fin: '',
    semana_inicio: '',
    semana_fin: ''
};

const EMPTY_LAPSO = {
    codigo_periodo: '',
    fecha_inicio: '',
    fecha_fin: '',
    semana_inicio: '',
    semana_fin: ''
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

    // Lapsos de Correcciones
    const [lapsos, setLapsos] = useState([]);
    const [loadingLapsos, setLoadingLapsos] = useState(false);
    const [showLapsoModal, setShowLapsoModal] = useState(false);
    const [editingLapso, setEditingLapso] = useState(null);
    const [lapsoForm, setLapsoForm] = useState(EMPTY_LAPSO);
    const [activeTab, setActiveTab] = useState('cortes'); // 'cortes' | 'lapsos'

    // Nuevo Periodo
    const [pensums, setPensums] = useState([]);
    const [showPeriodoModal, setShowPeriodoModal] = useState(false);
    const [periodoForm, setPeriodoForm] = useState({
        fecha_inicio: '',
        fecha_fin: '',
        id_pensum: ''
    });

    // Helper Semanas
    const [useWeeksForCortes, setUseWeeksForCortes] = useState(false);
    const [useWeeksForLapsos, setUseWeeksForLapsos] = useState(false);

    const getMonday = (dateStr) => {
        if (!dateStr) return new Date();
        const d = new Date(dateStr.split('T')[0] + 'T00:00:00');
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    };

    const addDays = (date, days) => {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    };

    const formatYMD = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const validWeeks = useMemo(() => {
        if (!selectedPeriodo || !selectedPeriodo.fecha_inicio || !selectedPeriodo.fecha_fin) return [];
        const weeks = [];
        const pFin = new Date(selectedPeriodo.fecha_fin.split('T')[0] + 'T00:00:00');
        
        let currentMonday = getMonday(selectedPeriodo.fecha_inicio);
        let weekNum = 1;
        
        while (currentMonday <= pFin) {
            const currentSunday = addDays(currentMonday, 6);
            weeks.push({
                orden: weekNum,
                lunes: formatYMD(currentMonday),
                domingo: formatYMD(currentSunday),
                label: `Semana ${weekNum} (${formatYMD(currentMonday)} a ${formatYMD(currentSunday)})`
            });
            currentMonday = addDays(currentMonday, 7);
            weekNum++;
        }
        return weeks;
    }, [selectedPeriodo]);

    // Auth guard
    useEffect(() => {
        if (!user || user.id_rol !== 1) {
            navigate('/login');
        } else {
            loadPeriodos();
            loadPensums();
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

    const loadPensums = async () => {
        try {
            const result = await periodosService.getPensums();
            if (result.success) {
                const lista = result.data.data || result.data || [];
                setPensums(lista);
            }
        } catch (err) {
            console.error('Error cargando pensums:', err);
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

    const loadLapsos = async (codigoPeriodo) => {
        setLoadingLapsos(true);
        setLapsos([]);
        try {
            const result = await periodosService.getLapsosByPeriodo(codigoPeriodo);
            if (result.success) {
                const lista = result.data.lapsos || result.data || [];
                const sorted = (Array.isArray(lista) ? lista : []).sort((a,b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio));
                setLapsos(sorted);
            }
        } catch (err) {
            console.error('Error cargando lapsos:', err);
        } finally {
            setLoadingLapsos(false);
        }
    };

    const handleSelectPeriodo = (periodo) => {
        setSelectedPeriodo(periodo);
        loadCortes(periodo.codigo);
        loadLapsos(periodo.codigo);
        setActiveTab('cortes');
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

    const handleDeletePeriodo = (periodo, e) => {
        e.stopPropagation();
        Swal.fire({
            title: '¿Eliminar periodo?',
            text: `Se eliminará el periodo ${periodo.codigo} y todos sus cortes asociados. Esta acción no se puede deshacer.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then(async (res) => {
            if (res.isConfirmed) {
                const result = await periodosService.deletePeriodo(periodo.codigo);
                if (result.success) {
                    Swal.fire('Eliminado', 'El periodo ha sido eliminado.', 'success');
                    if (selectedPeriodo?.codigo === periodo.codigo) {
                        setSelectedPeriodo(null);
                        setCortes([]);
                    }
                    loadPeriodos();
                } else {
                    Swal.fire('Error', result.mensaje || 'No se pudo eliminar el periodo.', 'error');
                }
            }
        });
    };

    const openAddPeriodoModal = () => {
        setPeriodoForm({ fecha_inicio: '', fecha_fin: '', id_pensum: '' });
        setShowPeriodoModal(true);
    };

    const handlePeriodoFormChange = (e) => {
        setPeriodoForm(f => ({ ...f, [e.target.name]: e.target.value }));
    };

    const handlePeriodoSubmit = async (e) => {
        e.preventDefault();

        if (new Date(periodoForm.fecha_inicio) > new Date(periodoForm.fecha_fin)) {
            Swal.fire('Error', 'La fecha de inicio no puede ser mayor a la fecha de fin.', 'error');
            return;
        }

        // Generar código
        const currentYear = new Date().getFullYear();
        const yearPeriodos = periodos.filter(p => p.codigo && p.codigo.startsWith(`${currentYear}-`));
        let maxSuffix = 0;
        yearPeriodos.forEach(p => {
            const parts = p.codigo.split('-');
            if (parts.length === 2) {
                const num = parseInt(parts[1], 10);
                if (!isNaN(num) && num > maxSuffix) maxSuffix = num;
            }
        });
        const nuevoCodigo = `${currentYear}-${maxSuffix + 1}`;

        const payload = {
            codigo: nuevoCodigo,
            fecha_inicio: periodoForm.fecha_inicio,
            fecha_fin: periodoForm.fecha_fin,
            id_pensum: periodoForm.id_pensum // id_pensum se manda tal cual, el backend decide formato (num/string)
        };

        const result = await periodosService.createPeriodo(payload);
        if (result.success) {
            Swal.fire('Éxito', `Periodo ${nuevoCodigo} creado correctamente.`, 'success');
            setShowPeriodoModal(false);
            loadPeriodos();
        } else {
            Swal.fire('Error', result.mensaje || 'No se pudo crear el periodo.', 'error');
        }
    };

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
        const { name, value } = e.target;
        setCorteForm(f => {
            const nf = { ...f, [name]: value };
            
            if (name === 'fecha_inicio') {
                nf.fecha_fin = '';
            }

            if (name === 'semana_inicio') {
                if (nf.semana_inicio && (!nf.semana_fin || parseInt(nf.semana_fin) < parseInt(nf.semana_inicio))) {
                    nf.semana_fin = nf.semana_inicio;
                }
            } else if (name === 'semana_fin') {
                if (nf.semana_inicio && nf.semana_fin && parseInt(nf.semana_fin) < parseInt(nf.semana_inicio)) {
                    nf.semana_fin = nf.semana_inicio;
                }
            }

            if (name === 'semana_inicio' || name === 'semana_fin') {
                if (nf.semana_inicio && nf.semana_fin) {
                    const w1 = validWeeks.find(w => w.orden === parseInt(nf.semana_inicio));
                    const w2 = validWeeks.find(w => w.orden === parseInt(nf.semana_fin));
                    if (w1 && w2 && parseInt(nf.semana_inicio) <= parseInt(nf.semana_fin)) {
                        nf.fecha_inicio = w1.lunes;
                        nf.fecha_fin = w2.domingo;
                    }
                }
            }
            return nf;
        });
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

    // ────────── CRUD Lapsos ──────────
    const openAddLapsoModal = () => {
        setEditingLapso(null);
        setLapsoForm({ ...EMPTY_LAPSO, codigo_periodo: selectedPeriodo.codigo });
        setShowLapsoModal(true);
    };

    const openEditLapsoModal = (lapso) => {
        setEditingLapso(lapso);
        setLapsoForm({
            codigo_periodo: selectedPeriodo.codigo,
            fecha_inicio: lapso.fecha_inicio?.split('T')[0] || lapso.fecha_inicio,
            fecha_fin: lapso.fecha_fin?.split('T')[0] || lapso.fecha_fin
        });
        setShowLapsoModal(true);
    };

    const handleLapsoFormChange = (e) => {
        const { name, value } = e.target;
        setLapsoForm(f => {
            const nf = { ...f, [name]: value };
            
            if (name === 'fecha_inicio') {
                nf.fecha_fin = '';
            }

            if (name === 'semana_inicio') {
                if (nf.semana_inicio && (!nf.semana_fin || parseInt(nf.semana_fin) < parseInt(nf.semana_inicio))) {
                    nf.semana_fin = nf.semana_inicio;
                }
            } else if (name === 'semana_fin') {
                if (nf.semana_inicio && nf.semana_fin && parseInt(nf.semana_fin) < parseInt(nf.semana_inicio)) {
                    nf.semana_fin = nf.semana_inicio;
                }
            }

            if (name === 'semana_inicio' || name === 'semana_fin') {
                if (nf.semana_inicio && nf.semana_fin) {
                    const w1 = validWeeks.find(w => w.orden === parseInt(nf.semana_inicio));
                    const w2 = validWeeks.find(w => w.orden === parseInt(nf.semana_fin));
                    if (w1 && w2 && parseInt(nf.semana_inicio) <= parseInt(nf.semana_fin)) {
                        nf.fecha_inicio = w1.lunes;
                        nf.fecha_fin = w2.domingo;
                    }
                }
            }
            return nf;
        });
    };

    const handleLapsoSubmit = async (e) => {
        e.preventDefault();
        const lInicio = new Date(lapsoForm.fecha_inicio);
        const lFin = new Date(lapsoForm.fecha_fin);
        const pInicio = new Date(selectedPeriodo.fecha_inicio);
        const pFin = new Date(selectedPeriodo.fecha_fin);

        if (lInicio < pInicio || lFin > pFin) {
            Swal.fire('Error', 'Las fechas del lapso deben estar dentro del rango del periodo.', 'error');
            return;
        }
        if (lInicio > lFin) {
            Swal.fire('Error', 'La fecha de inicio no puede ser mayor a la de fin.', 'error');
            return;
        }

        // Se envía codigo_periodo y fechas. El backend se encarga de guardarlo.
        const payload = { ...lapsoForm };
        let result;
        if (editingLapso) {
            result = await periodosService.updateLapso(editingLapso.id || editingLapso.id_lapso_correccion, payload);
        } else {
            result = await periodosService.createLapso(payload);
        }

        if (result.success) {
            Swal.fire('Éxito', editingLapso ? 'Lapso actualizado correctamente.' : 'Lapso agregado correctamente.', 'success');
            setShowLapsoModal(false);
            loadLapsos(selectedPeriodo.codigo);
        } else {
            Swal.fire('Error', result.mensaje || 'No se pudo guardar el lapso.', 'error');
        }
    };

    const handleDeleteLapso = (lapso) => {
        Swal.fire({
            title: '¿Eliminar lapso?',
            text: `Se eliminará el lapso seleccionado de este periodo.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then(async (res) => {
            if (res.isConfirmed) {
                const result = await periodosService.deleteLapso(lapso.id || lapso.id_lapso_correccion);
                if (result.success) {
                    Swal.fire('Eliminado', 'El lapso ha sido eliminado.', 'success');
                    loadLapsos(selectedPeriodo.codigo);
                } else {
                    Swal.fire('Error', result.mensaje || 'No se pudo eliminar el lapso.', 'error');
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
                                    <button
                                        className="btns btn-abrir-modal"
                                        onClick={openAddPeriodoModal}
                                        style={{ background: '#10b981', color: '#fff', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', fontSize: '13px' }}
                                    >
                                        <i className="fa fa-plus"></i>
                                        Nuevo Periodo
                                    </button>
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
                                                                    onClick={e => handleDeletePeriodo(p, e)}
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

                        {/* ── Panel Derecho (Cortes / Lapsos) ── */}
                        <div className="periodos-panel-right">
                            {!selectedPeriodo ? (
                                <div className="card periodos-empty-state">
                                    <i className="fas fa-hand-pointer periodos-empty-icon"></i>
                                    <p>Selecciona un periodo para ver y gestionar sus cortes y lapsos de correcciones.</p>
                                </div>
                            ) : (
                                <div className="card">
                                    <div className="card-header" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                            <div>
                                                <span className="card-title">
                                                    <i className="fas fa-calendar-check" style={{ marginRight: '8px', color: 'var(--color-primary)' }}></i>
                                                    Gestión del Periodo — {selectedPeriodo.codigo}
                                                </span>
                                                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                                                    Rango general: <strong>{formatDate(selectedPeriodo.fecha_inicio)}</strong> → <strong>{formatDate(selectedPeriodo.fecha_fin)}</strong>
                                                </div>
                                            </div>
                                            <button
                                                className="btns btn-abrir-modal"
                                                onClick={activeTab === 'cortes' ? openAddCorteModal : openAddLapsoModal}
                                                style={{ background: '#3b82f6', color: '#fff', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', fontSize: '13px' }}
                                            >
                                                <i className="fa fa-plus"></i>
                                                {activeTab === 'cortes' ? 'Agregar Corte' : 'Agregar Lapso'}
                                            </button>
                                        </div>

                                        {/* Tabs Selector */}
                                        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', gap: '20px' }}>
                                            <button 
                                                onClick={() => setActiveTab('cortes')}
                                                style={{ padding: '8px 12px', background: 'none', border: 'none', borderBottom: activeTab === 'cortes' ? '2px solid var(--color-primary)' : '2px solid transparent', color: activeTab === 'cortes' ? 'var(--color-primary)' : '#64748b', fontWeight: '600', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}
                                            >
                                                <i className="fas fa-cut"></i> Cortes
                                            </button>
                                            <button 
                                                onClick={() => setActiveTab('lapsos')}
                                                style={{ padding: '8px 12px', background: 'none', border: 'none', borderBottom: activeTab === 'lapsos' ? '2px solid var(--color-primary)' : '2px solid transparent', color: activeTab === 'lapsos' ? 'var(--color-primary)' : '#64748b', fontWeight: '600', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}
                                            >
                                                <i className="fas fa-user-edit"></i> Lapsos de Correcciones
                                            </button>
                                        </div>
                                    </div>

                                    <div className="card-content" style={{ padding: '20px' }}>
                                        {/* VIEW CORTES */}
                                        {activeTab === 'cortes' && (
                                            <>
                                                {loadingCortes ? (
                                                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
                                                        <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', marginBottom: '10px' }}></i>
                                                        <p>Cargando cortes...</p>
                                                    </div>
                                                ) : cortes.length === 0 ? (
                                                    <div className="periodos-empty-state" style={{ padding: '40px 20px', background: '#f8fafc', borderRadius: '12px' }}>
                                                        <i className="fas fa-inbox periodos-empty-icon" style={{ fontSize: '36px', color: '#94a3b8' }}></i>
                                                        <p style={{ color: '#64748b' }}>Este periodo no tiene cortes aún.</p>
                                                    </div>
                                                ) : (
                                                    <div className="cortes-list">
                                                        {cortes.map((corte, idx) => (
                                                            <div key={`${corte.codigo_periodo}-${corte.orden}`} className="corte-card">
                                                                <div className="corte-orden"><span>{corte.orden}</span></div>
                                                                <div className="corte-info">
                                                                    <div className="corte-titulo">Corte #{corte.orden}</div>
                                                                    <div className="corte-fechas">
                                                                        <span><i className="fa fa-calendar-check" style={{ marginRight: '4px', color: 'var(--color-success)' }}></i>{formatDate(corte.fecha_inicio)}</span>
                                                                        <span className="corte-flecha">→</span>
                                                                        <span><i className="fa fa-calendar-times" style={{ marginRight: '4px', color: 'var(--color-danger)' }}></i>{formatDate(corte.fecha_fin)}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="corte-actions">
                                                                    <button className="btns btn-edit" title="Editar" onClick={() => openEditCorteModal(corte)}><i className="fa fa-edit"></i></button>
                                                                    {!corte.modificable && (
                                                                        <button className="btns btn-delete" title="Eliminar" onClick={() => handleDeleteCorte(corte)}><i className="fa fa-trash"></i></button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {/* VIEW LAPSOS */}
                                        {activeTab === 'lapsos' && (
                                            <>
                                                {loadingLapsos ? (
                                                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
                                                        <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', marginBottom: '10px' }}></i>
                                                        <p>Cargando lapsos...</p>
                                                    </div>
                                                ) : lapsos.length === 0 ? (
                                                    <div className="periodos-empty-state" style={{ padding: '40px 20px', background: '#f8fafc', borderRadius: '12px' }}>
                                                        <i className="fas fa-folder-open periodos-empty-icon" style={{ fontSize: '36px', color: '#94a3b8' }}></i>
                                                        <p style={{ color: '#64748b' }}>No hay lapsos de correcciones registrados en este periodo.</p>
                                                    </div>
                                                ) : (
                                                    <div className="cortes-list">
                                                        {lapsos.map((lapso, idx) => (
                                                            <div key={lapso.id || lapso.id_lapso_correccion || idx} className="corte-card" style={{ borderLeftColor: '#f59e0b' }}>
                                                                <div className="corte-orden" style={{ background: '#fef3c7', color: '#d97706' }}>
                                                                    <span><i className="fas fa-pen"></i></span>
                                                                </div>
                                                                <div className="corte-info">
                                                                    <div className="corte-titulo" style={{ color: '#92400e' }}>Lapso de Corrección</div>
                                                                    <div className="corte-fechas">
                                                                        <span><i className="fa fa-calendar-check" style={{ marginRight: '4px', color: 'var(--color-success)' }}></i>{formatDate(lapso.fecha_inicio)}</span>
                                                                        <span className="corte-flecha">→</span>
                                                                        <span><i className="fa fa-calendar-times" style={{ marginRight: '4px', color: 'var(--color-danger)' }}></i>{formatDate(lapso.fecha_fin)}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="corte-actions">
                                                                    <button className="btns btn-edit" title="Editar" onClick={() => openEditLapsoModal(lapso)}><i className="fa fa-edit"></i></button>
                                                                    <button className="btns btn-delete" title="Eliminar" onClick={() => handleDeleteLapso(lapso)}><i className="fa fa-trash"></i></button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
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
                    <div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                        <span className="close-btn" onClick={() => setShowCorteModal(false)}>&times;</span>
                        <h2>{editingCorte ? 'Editar Corte' : 'Agregar Corte'}</h2>
                        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
                            Periodo: <strong>{selectedPeriodo?.codigo}</strong> &nbsp;|&nbsp;
                            Inicio y Fin: <strong>{formatDate(selectedPeriodo?.fecha_inicio)}</strong> → <strong>{formatDate(selectedPeriodo?.fecha_fin)}</strong>
                        </p>
                        <form onSubmit={handleCorteSubmit}>
                            <div 
                                onClick={() => setUseWeeksForCortes(!useWeeksForCortes)}
                                style={{ 
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                                    background: useWeeksForCortes ? '#ebf5ff' : '#f8fafc',
                                    border: `1px solid ${useWeeksForCortes ? '#bfdbfe' : '#e2e8f0'}`,
                                    padding: '12px 16px', borderRadius: '8px', marginBottom: '15px',
                                    cursor: 'pointer', transition: 'all 0.3s ease'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '36px', height: '36px', borderRadius: '50%', 
                                        background: useWeeksForCortes ? '#3b82f6' : '#cbd5e1',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'white', transition: 'all 0.3s'
                                    }}>
                                        <i className="fas fa-calendar-week"></i>
                                    </div>
                                    <div>
                                        <span style={{ display: 'block', fontWeight: '600', color: useWeeksForCortes ? '#1e3a8a' : '#475569', fontSize: '14px' }}>
                                            Selección por Semanas
                                        </span>
                                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                                            {useWeeksForCortes ? 'Fechas autocalculadas' : 'Usar rangos semanales'}
                                        </span>
                                    </div>
                                </div>
                                <div style={{
                                    width: '44px', height: '24px', background: useWeeksForCortes ? '#3b82f6' : '#cbd5e1',
                                    borderRadius: '12px', position: 'relative', transition: 'background 0.3s'
                                }}>
                                    <div style={{
                                        width: '20px', height: '20px', background: 'white', borderRadius: '50%',
                                        position: 'absolute', top: '2px', left: useWeeksForCortes ? '22px' : '2px',
                                        transition: 'left 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                                    }} />
                                </div>
                            </div>
                            
                            {useWeeksForCortes && (
                                <div style={{ 
                                    display: 'flex', gap: '15px', marginBottom: '20px', 
                                    background: '#f0f9ff', padding: '16px', borderRadius: '8px',
                                    border: '1px dashed #7dd3fc', animation: 'fadeIn 0.3s ease-in-out'
                                }}>
                                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                        <label style={{ color: '#0369a1', fontWeight: '600', fontSize: '13px' }}>Semana Inicial:</label>
                                        <select 
                                            name="semana_inicio" 
                                            value={corteForm.semana_inicio || ''} 
                                            onChange={handleCorteFormChange} 
                                            required={useWeeksForCortes}
                                            style={{ 
                                                border: '1px solid #bae6fd', borderRadius: '6px', 
                                                padding: '8px', width: '100%', outline: 'none',
                                                color: '#0f172a', background: 'white'
                                            }}
                                        >
                                            <option value="">-- Seleccionar --</option>
                                            {validWeeks.map(w => <option key={w.orden} value={w.orden}>{w.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                        <label style={{ color: '#0369a1', fontWeight: '600', fontSize: '13px' }}>Semana Final:</label>
                                        <select 
                                            name="semana_fin" 
                                            value={corteForm.semana_fin || ''} 
                                            onChange={handleCorteFormChange} 
                                            required={useWeeksForCortes}
                                            style={{ 
                                                border: '1px solid #bae6fd', borderRadius: '6px', 
                                                padding: '8px', width: '100%', outline: 'none',
                                                color: '#0f172a', background: 'white'
                                            }}
                                        >
                                            <option value="">-- Seleccionar --</option>
                                            {validWeeks.map(w => <option key={w.orden} value={w.orden} disabled={corteForm.semana_inicio && w.orden < parseInt(corteForm.semana_inicio)}>{w.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}

                            <div className="form-group">
                                <label>Número del Corte:</label>
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
                                    disabled={useWeeksForCortes}
                                    style={{ background: useWeeksForCortes ? '#f3f4f6' : undefined }}
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
                                    min={corteForm.fecha_inicio || selectedPeriodo?.fecha_inicio?.split('T')[0]}
                                    max={selectedPeriodo?.fecha_fin?.split('T')[0]}
                                    disabled={useWeeksForCortes}
                                    style={{ background: useWeeksForCortes ? '#f3f4f6' : undefined }}
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

            {/* ── Modal Agregar / Editar Lapso ── */}
            {showLapsoModal && (
                <div className="modal-add-usuarios active">
                    <div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                        <span className="close-btn" onClick={() => setShowLapsoModal(false)}>&times;</span>
                        <h2>{editingLapso ? 'Editar Lapso de Correcciones' : 'Agregar Lapso de Correcciones'}</h2>
                        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
                            Periodo: <strong>{selectedPeriodo?.codigo}</strong> &nbsp;|&nbsp;
                            Inicio y Fin: <strong>{formatDate(selectedPeriodo?.fecha_inicio)}</strong> → <strong>{formatDate(selectedPeriodo?.fecha_fin)}</strong>
                        </p>
                        <form onSubmit={handleLapsoSubmit}>
                            <div 
                                onClick={() => setUseWeeksForLapsos(!useWeeksForLapsos)}
                                style={{ 
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                                    background: useWeeksForLapsos ? '#ebf5ff' : '#f8fafc',
                                    border: `1px solid ${useWeeksForLapsos ? '#bfdbfe' : '#e2e8f0'}`,
                                    padding: '12px 16px', borderRadius: '8px', marginBottom: '15px',
                                    cursor: 'pointer', transition: 'all 0.3s ease'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '36px', height: '36px', borderRadius: '50%', 
                                        background: useWeeksForLapsos ? '#3b82f6' : '#cbd5e1',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'white', transition: 'all 0.3s'
                                    }}>
                                        <i className="fas fa-calendar-week"></i>
                                    </div>
                                    <div>
                                        <span style={{ display: 'block', fontWeight: '600', color: useWeeksForLapsos ? '#1e3a8a' : '#475569', fontSize: '14px' }}>
                                            Selección por Semanas
                                        </span>
                                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                                            {useWeeksForLapsos ? 'Fechas autocalculadas' : 'Usar rangos semanales'}
                                        </span>
                                    </div>
                                </div>
                                <div style={{
                                    width: '44px', height: '24px', background: useWeeksForLapsos ? '#3b82f6' : '#cbd5e1',
                                    borderRadius: '12px', position: 'relative', transition: 'background 0.3s'
                                }}>
                                    <div style={{
                                        width: '20px', height: '20px', background: 'white', borderRadius: '50%',
                                        position: 'absolute', top: '2px', left: useWeeksForLapsos ? '22px' : '2px',
                                        transition: 'left 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                                    }} />
                                </div>
                            </div>
                            
                            {useWeeksForLapsos && (
                                <div style={{ 
                                    display: 'flex', gap: '15px', marginBottom: '20px', 
                                    background: '#f0f9ff', padding: '16px', borderRadius: '8px',
                                    border: '1px dashed #7dd3fc', animation: 'fadeIn 0.3s ease-in-out'
                                }}>
                                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                        <label style={{ color: '#0369a1', fontWeight: '600', fontSize: '13px' }}>Semana Inicial:</label>
                                        <select 
                                            name="semana_inicio" 
                                            value={lapsoForm.semana_inicio || ''} 
                                            onChange={handleLapsoFormChange} 
                                            required={useWeeksForLapsos}
                                            style={{ 
                                                border: '1px solid #bae6fd', borderRadius: '6px', 
                                                padding: '8px', width: '100%', outline: 'none',
                                                color: '#0f172a', background: 'white'
                                            }}
                                        >
                                            <option value="">-- Seleccionar --</option>
                                            {validWeeks.map(w => <option key={w.orden} value={w.orden}>{w.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                        <label style={{ color: '#0369a1', fontWeight: '600', fontSize: '13px' }}>Semana Final:</label>
                                        <select 
                                            name="semana_fin" 
                                            value={lapsoForm.semana_fin || ''} 
                                            onChange={handleLapsoFormChange} 
                                            required={useWeeksForLapsos}
                                            style={{ 
                                                border: '1px solid #bae6fd', borderRadius: '6px', 
                                                padding: '8px', width: '100%', outline: 'none',
                                                color: '#0f172a', background: 'white'
                                            }}
                                        >
                                            <option value="">-- Seleccionar --</option>
                                            {validWeeks.map(w => <option key={w.orden} value={w.orden} disabled={lapsoForm.semana_inicio && w.orden < parseInt(lapsoForm.semana_inicio)}>{w.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}

                            <div className="form-group">
                                <label>Fecha Inicio:</label>
                                <input
                                    type="date"
                                    name="fecha_inicio"
                                    value={lapsoForm.fecha_inicio}
                                    onChange={handleLapsoFormChange}
                                    required
                                    min={selectedPeriodo?.fecha_inicio?.split('T')[0]}
                                    max={selectedPeriodo?.fecha_fin?.split('T')[0]}
                                    disabled={useWeeksForLapsos}
                                    style={{ background: useWeeksForLapsos ? '#f3f4f6' : undefined }}
                                />
                            </div>
                            <div className="form-group">
                                <label>Fecha Fin:</label>
                                <input
                                    type="date"
                                    name="fecha_fin"
                                    value={lapsoForm.fecha_fin}
                                    onChange={handleLapsoFormChange}
                                    required
                                    min={lapsoForm.fecha_inicio || selectedPeriodo?.fecha_inicio?.split('T')[0]}
                                    max={selectedPeriodo?.fecha_fin?.split('T')[0]}
                                    disabled={useWeeksForLapsos}
                                    style={{ background: useWeeksForLapsos ? '#f3f4f6' : undefined }}
                                />
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowLapsoModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-submit">{editingLapso ? 'Guardar Cambios' : 'Agregar'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Modal Agregar Periodo ── */}
            {showPeriodoModal && (
                <div className="modal-add-usuarios active">
                    <div className="modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                        <span className="close-btn" onClick={() => setShowPeriodoModal(false)}>&times;</span>
                        <h2>Agregar Nuevo Periodo</h2>
                        <form onSubmit={handlePeriodoSubmit}>
                            <div className="form-group">
                                <label>Fecha de Inicio:</label>
                                <input
                                    type="date"
                                    name="fecha_inicio"
                                    value={periodoForm.fecha_inicio}
                                    onChange={handlePeriodoFormChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Fecha de Fin:</label>
                                <input
                                    type="date"
                                    name="fecha_fin"
                                    value={periodoForm.fecha_fin}
                                    onChange={handlePeriodoFormChange}
                                    required
                                    min={periodoForm.fecha_inicio}
                                />
                            </div>
                            <div className="form-group">
                                <label>Pensum:</label>
                                <select
                                    name="id_pensum"
                                    value={periodoForm.id_pensum}
                                    onChange={handlePeriodoFormChange}
                                    required
                                >
                                    <option value="" disabled>-- Seleccione un pensum --</option>
                                    {pensums.map(pen => (
                                        <option key={pen.id} value={pen.id}>
                                            {pen.nombre || `Pensum ${pen.id}`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn-cancel" onClick={() => setShowPeriodoModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-submit">Crear Periodo</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}