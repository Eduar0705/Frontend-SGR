import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Menu from '../components/menu';
import Header from '../components/header';
import ModalVerEstudiante from './components/ModalVerEstudiante';
import { estudiantesService } from '../services/estudiantes.service';
import '../assets/css/home.css';
import '../assets/css/estudiantes.css';

export default function TeacherEstudiantes() {
    const navigate = useNavigate();
    const [user] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    const [estudiantes, setEstudiantes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [carreraFilter, setCarreraFilter] = useState('');
    const [seccionFilter, setSeccionFilter] = useState('');
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedEstudiante, setSelectedEstudiante] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchEstudiantes();
    }, [user, navigate]);

    const fetchEstudiantes = async () => {
        setLoading(true);
        try {
            const response = await estudiantesService.getEstudiantes();
            if (response.success) {
                setEstudiantes(response.estudiantes || []);
            } else {
                Swal.fire('Error', response.message || 'Error al cargar estudiantes', 'error');
            }
        } catch (error) {
            console.error('Error in fetchEstudiantes:', error);
            Swal.fire('Error', 'No se pudieron cargar los estudiantes', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleVerEstudiante = async (cedula) => {
        try {
            Swal.showLoading();
            const response = await estudiantesService.getEstudianteByCedula(cedula);
            Swal.close();
            if (response.success) {
                setSelectedEstudiante(response.estudiante);
                setShowModal(true);
            } else {
                Swal.fire('Error', response.message || 'No se pudo obtener el detalle del estudiante', 'error');
            }
        } catch (error) {
            Swal.close();
            console.error('Error in handleVerEstudiante:', error);
            Swal.fire('Error', 'Conexión fallida', 'error');
        }
    };

    // Filtros dinámicos
    const filteredEstudiantes = estudiantes.filter(est => {
        const fullName = `${est.nombre} ${est.apellido}`.toLowerCase();
        const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                             est.cedula.includes(searchTerm);
        const matchesCarrera = carreraFilter === '' || est.carrera_codigo === carreraFilter;
        const matchesSeccion = seccionFilter === '' || est.seccion.includes(seccionFilter);
        
        return matchesSearch && matchesCarrera && matchesSeccion;
    });

    // Paginación
    const totalEntries = filteredEstudiantes.length;
    const finalItemsPerPage = itemsPerPage === 'all' ? totalEntries : parseInt(itemsPerPage);
    const totalPages = Math.ceil(totalEntries / finalItemsPerPage) || 1;
    const startIndex = (currentPage - 1) * finalItemsPerPage;
    const paginatedItems = filteredEstudiantes.slice(startIndex, startIndex + finalItemsPerPage);

    const getUniqueCarreras = () => {
        const unique = [];
        estudiantes.forEach(est => {
            if (est.carrera_codigo && !unique.find(c => c.codigo === est.carrera_codigo)) {
                unique.push({ codigo: est.carrera_codigo, nombre: est.carrera_nombre });
            }
        });
        return unique;
    };

    const getUniqueSecciones = () => {
        const unique = new Set();
        estudiantes.forEach(est => {
            if (est.seccion) {
                est.seccion.split(',').forEach(s => unique.add(s.trim()));
            }
        });
        return Array.from(unique).sort();
    };

    if (!user) return null;

    return (
        <main className="main-content">
            <Menu user={user} />
            <div className="content-wrapper">
                <Header title="Gestión de Estudiantes" user={user} onLogout={() => navigate('/login')} />
                
                <div className="view active" id="estudiantes" style={{ padding: '20px' }}>
                    <div className="view-header">
                        <div className="search-box">
                            <i className="fas fa-search"></i>
                            <input 
                                type="text" 
                                placeholder="Buscar estudiantes..." 
                                value={searchTerm}
                                onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
                            />
                        </div>
                        <div className="filter-group">
                            <select 
                                className="form-select" 
                                value={carreraFilter} 
                                onChange={(e) => {setCarreraFilter(e.target.value); setCurrentPage(1);}}
                            >
                                <option value="">Todas las Carreras</option>
                                {getUniqueCarreras().map(c => (
                                    <option key={c.codigo} value={c.codigo}>{c.nombre || c.codigo}</option>
                                ))}
                            </select>
                            <select 
                                className="form-select" 
                                value={seccionFilter} 
                                onChange={(e) => {setSeccionFilter(e.target.value); setCurrentPage(1);}}
                            >
                                <option value="">Todas las Secciones</option>
                                {getUniqueSecciones().map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="pagination-controls">
                        <div className="entries-control">
                            <label>Mostrar:</label>
                            <select 
                                className="entries-select" 
                                value={itemsPerPage} 
                                onChange={(e) => {setItemsPerPage(e.target.value); setCurrentPage(1);}}
                            >
                                <option value="10">10</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                                <option value="all">Todos</option>
                            </select>
                            <span>estudiantes</span>
                        </div>
                        <div className="pagination-info">
                            Mostrando <span>{totalEntries > 0 ? startIndex + 1 : 0}</span> a <span>{Math.min(startIndex + finalItemsPerPage, totalEntries)}</span> de <span>{totalEntries}</span> estudiantes
                        </div>
                    </div>

                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Estudiante</th>
                                    <th>Cédula</th>
                                    <th>Carrera</th>
                                    <th>Sección</th>
                                    <th>Correo</th>
                                    <th>Evaluaciones</th>
                                    <th>Promedio</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="8" className="no-data">Cargando datos...</td></tr>
                                ) : paginatedItems.length > 0 ? (
                                    paginatedItems.map((est, index) => (
                                        <tr key={`${est.cedula}-${index}`}>
                                            <td className="student-name">
                                                <span>{est.nombre} {est.apellido}</span>
                                            </td>
                                            <td>{est.cedula}</td>
                                            <td>
                                                <span className="badge-carrera">
                                                    {est.carrera_nombre || 'Sin carrera'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="badge-seccion">
                                                    {est.seccion || 'Sin sección'}
                                                </span>
                                            </td>
                                            <td>
                                                <a href={`mailto:${est.email}`} className="email-link">
                                                    {est.email}
                                                </a>
                                            </td>
                                            <td>
                                                <span className="badge-evaluaciones">
                                                    {est.total_evaluaciones || 0}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`promedio ${est.promedio_puntaje >= 70 ? 'alto' : (est.promedio_puntaje >= 50 ? 'medio' : 'bajo')}`}>
                                                    {est.promedio_puntaje ? parseFloat(est.promedio_puntaje).toFixed(2) : '0.00'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="table-actions">
                                                    <button className="btns btn-view" onClick={() => handleVerEstudiante(est.cedula)} title="Ver detalles">
                                                        <i className="fas fa-eye"></i>
                                                    </button>
                                                    <button className="btns btn-evaluate" onClick={() => navigate('/teacher/evaluaciones')} title="Ir a evaluaciones">
                                                        <i className="fas fa-chart-bar"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="no-data">
                                            <i className="fas fa-users"></i>
                                            No se encontraron estudiantes
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {itemsPerPage !== 'all' && totalPages > 1 && (
                        <div className="pagination-buttons">
                            <button 
                                className="pagination-btn" 
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                            >
                                <i className="fas fa-chevron-left"></i>
                            </button>
                            {[...Array(totalPages)].map((_, i) => (
                                <button 
                                    key={i + 1} 
                                    className={`pagination-btn ${currentPage === i + 1 ? 'active' : ''}`}
                                    onClick={() => setCurrentPage(i + 1)}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button 
                                className="pagination-btn" 
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => p + 1)}
                            >
                                <i className="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {showModal && selectedEstudiante && (
                <ModalVerEstudiante 
                    estudiante={selectedEstudiante} 
                    onClose={() => setShowModal(false)} 
                />
            )}
        </main>
    );
}
