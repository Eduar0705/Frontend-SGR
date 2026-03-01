import React, { useState, useEffect } from 'react';
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

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchRubricas();
    }, [user, navigate]);

    const fetchRubricas = async () => {
        try {
            setLoading(true);
            const data = await teacherRubricasService.getRubricas();
            if (data.success) {
                setRubricas(data.rubricas || []);
            } else {
                Swal.fire('Error', data.message || 'Error al cargar rúbricas', 'error');
            }
        } catch (error) {
            console.error('Error fetching rubricas:', error);
            Swal.fire('Error', 'Error de conexión', 'error');
        } finally {
            setLoading(false);
            setGlobalLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "No podrás revertir esto. La rúbrica pasará a inactiva.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                const data = await teacherRubricasService.deleteRubrica(id);
                if (data.success) {
                    Swal.fire('Eliminada', 'La rúbrica ha sido eliminada.', 'success');
                    fetchRubricas();
                } else {
                    Swal.fire('Error', data.message || 'Error al eliminar la rúbrica', 'error');
                }
            } catch (error) {
                console.error('Error deleteRubrica:', error);
                Swal.fire('Error', 'Error de red', 'error');
            }
        }
    };

    const handleEdit = (id) => {
        navigate(`/teacher/rubricas/editar/${id}`);
    };

    const handleView = async (id) => {
        try {
            Swal.fire({ title: 'Cargando rúbrica...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            const data = await teacherRubricasService.getRubricaDetalle(id);
            if (data.success) {
                Swal.close();
                const opened = imprimirRubricaFormal(data.rubrica, data.criterios);
                if (!opened) {
                    Swal.fire('Atención', 'Por favor habilite las ventanas emergentes (pop-ups) para ver la rúbrica.', 'warning');
                }
            } else {
                Swal.fire('Error', data.message || 'Error al obtener rúbrica', 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Error de red', 'error');
        }
    };

    const filteredRubricas = rubricas.filter(r => 
        r.nombre_rubrica.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.materia_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.seccion_codigo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredRubricas.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredRubricas.length / itemsPerPage);

    if (!user) return null;

    return (
        <main className="main-content">
            <Menu user={user} />
            <div className="content-wrapper">
                <Header title="Mis Rúbricas" user={user} onLogout={() => navigate('/login')} />
                <div className="view active" style={{ padding: '20px' }}>
                    <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span>Mostrar:</span>
                            <select 
                                value={itemsPerPage} 
                                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px' }}
                            >
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                            </select>
                            <span>entradas</span>
                        </div>
                        <div className="search-box" style={{ position: 'relative' }}>
                            <i className="fa fa-search" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666' }}></i>
                            <input 
                                type="text" 
                                placeholder="Buscar rúbrica..." 
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                style={{ padding: '8px 12px 8px 30px', border: '1px solid #ddd', borderRadius: '6px' }}
                            />
                        </div>
                    </div>

                    <div className="table-container" style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
                        {loading ? (
                            <div style={{ padding: '20px', textAlign: 'center' }}>Cargando rúbricas...</div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: '#f8f9fa' }}>
                                    <tr>
                                        <th style={{ padding: '12px', borderBottom: '1px solid #ddd', textAlign: 'left' }}>Nombre G.</th>
                                        <th style={{ padding: '12px', borderBottom: '1px solid #ddd', textAlign: 'left' }}>Materia</th>
                                        <th style={{ padding: '12px', borderBottom: '1px solid #ddd', textAlign: 'left' }}>Sección</th>
                                        <th style={{ padding: '12px', borderBottom: '1px solid #ddd', textAlign: 'left' }}>Tipo</th>
                                        <th style={{ padding: '12px', borderBottom: '1px solid #ddd', textAlign: 'left' }}>%</th>
                                        <th style={{ padding: '12px', borderBottom: '1px solid #ddd', textAlign: 'left' }}>F. Evaluación</th>
                                        <th style={{ padding: '12px', borderBottom: '1px solid #ddd', textAlign: 'left' }}>Estado</th>
                                        <th style={{ padding: '12px', borderBottom: '1px solid #ddd', textAlign: 'center' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.length > 0 ? currentItems.map(rubrica => (
                                        <tr key={rubrica.id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '12px' }}>{rubrica.nombre_rubrica}</td>
                                            <td style={{ padding: '12px' }}>{rubrica.materia_nombre}</td>
                                            <td style={{ padding: '12px' }}>{rubrica.seccion_codigo}</td>
                                            <td style={{ padding: '12px' }}>{rubrica.tipo_evaluacion || 'N/A'}</td>
                                            <td style={{ padding: '12px' }}>{rubrica.porcentaje_evaluacion}%</td>
                                            <td style={{ padding: '12px' }}>{rubrica.fecha_evaluacion ? new Date(rubrica.fecha_evaluacion).toLocaleDateString() : 'N/A'}</td>
                                            <td style={{ padding: '12px' }}>
                                                <span className={`status-badge ${rubrica.estado === 'Activa' ? 'active' : 'inactive'}`} style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '0.85em', background: rubrica.estado === 'Activa' ? '#e2f5ec' : '#fee2e2', color: rubrica.estado === 'Activa' ? '#10b981' : '#ef4444' }}>
                                                    {rubrica.estado}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                    <button onClick={() => handleView(rubrica.id)} className="btn-icon view" title="Ver" style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer' }}>
                                                        <i className="fas fa-eye"></i>
                                                    </button>
                                                    <button onClick={() => handleEdit(rubrica.id)} className="btn-icon edit" title="Editar" style={{ background: '#eab308', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer' }}>
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    <button onClick={() => handleDelete(rubrica.id)} className="btn-icon delete" title="Eliminar" style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer' }}>
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="8" style={{ padding: '20px', textAlign: 'center' }}>No se encontraron rúbricas</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                        
                        {!loading && filteredRubricas.length > 0 && (
                            <div className="pagination" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderTop: '1px solid #eee' }}>
                                <span>Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, filteredRubricas.length)} de {filteredRubricas.length} entradas</span>
                                <div className="page-numbers" style={{ display: 'flex', gap: '5px' }}>
                                    <button 
                                        disabled={currentPage === 1} 
                                        onClick={() => setCurrentPage(prev => prev - 1)}
                                        style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: '4px', background: currentPage === 1 ? '#f5f5f5' : '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                                    >
                                        Anterior
                                    </button>
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button 
                                            key={i + 1} 
                                            onClick={() => setCurrentPage(i + 1)}
                                            style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: '4px', background: currentPage === i + 1 ? '#3b82f6' : '#fff', color: currentPage === i + 1 ? '#fff' : '#333', cursor: 'pointer' }}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                    <button 
                                        disabled={currentPage === totalPages} 
                                        onClick={() => setCurrentPage(prev => prev + 1)}
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
