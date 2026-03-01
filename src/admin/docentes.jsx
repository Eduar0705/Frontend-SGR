import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Menu from '../components/menu';
import Header from '../components/header';
import { docentesService } from '../services/docentes.service';
import Swal from 'sweetalert2';
import '../assets/css/docentes.css';

export default function Docentes() {
    const navigate = useNavigate();
    const [user] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });
    const [profesores, setProfesores] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- ESTADOS DE CONTROL ---
    const [searchTerm, setSearchTerm] = useState('');
    const [entriesPerPage, setEntriesPerPage] = useState(5);
    const [currentPage, setCurrentPage] = useState(1);

    // --- ESTADOS DE MODALES ---
    const [showFormModal, setShowFormModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    // --- ESTADO DEL FORMULARIO ---
    const [formData, setFormData] = useState({
        cedula: '', nombre: '', apellido: '', email: '', 
        telefono: '', especialidad: '', notas: '', activo: '1', cedula_og: ''
    });

    const cargarProfesores = async () => {
        try {
            const data = await docentesService.getDocentes();
            setProfesores(data || []);
            setLoading(false);
        } catch {
            Swal.fire('Error', 'No se pudieron cargar los datos', 'error');
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!user || !token) {
            navigate('/login');
        } else {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            cargarProfesores();
        }
    }, [navigate, user]);

    // --- VALIDACIONES EN TIEMPO REAL ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        // Validación: Solo números para Cédula y Teléfono
        if ((name === 'cedula' || name === 'telefono') && !/^\d*$/.test(value)) return;
        // Validación: Solo letras para Nombre y Apellido
        if ((name === 'nombre' || name === 'apellido') && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/.test(value)) return;
        
        setFormData({ ...formData, [name]: value });
    };

    const validateBeforeSubmit = (e) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.cedula.length < 7) {
            e.preventDefault();
            return Swal.fire('Cédula Inválida', 'Debe tener al menos 7 dígitos', 'warning');
        }
        if (!emailRegex.test(formData.email)) {
            e.preventDefault();
            return Swal.fire('Email Inválido', 'Ingresa un correo electrónico real', 'warning');
        }
    };

    // --- MANEJO DE ACCIONES ---
    const openAddModal = () => {
        setIsEditMode(false);
        setFormData({ cedula: '', nombre: '', apellido: '', email: '', telefono: '', especialidad: '', notas: '', activo: '1', cedula_og: '' });
        setShowFormModal(true);
    };

    const openEditModal = (profe) => {
        setIsEditMode(true);
        setFormData({
            cedula: profe.cedula, nombre: profe.nombre, apellido: profe.apellido,
            email: profe.email, telefono: profe.telf || '', 
            especialidad: profe.especializacion, notas: profe.descripcion || '',
            activo: profe.activo.toString(), cedula_og: profe.cedula
        });
        setShowFormModal(true);
    };

    const openViewModal = (profe) => {
        setFormData(profe);
        setShowViewModal(true);
    };

    const handleDelete = () => {
        Swal.fire({
            title: '¿Eliminar docente?',
            text: "Esta acción no se puede revertir.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3b82f6',
            cancelButtonColor: '#ef4444',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                // Aquí iría el llamado a tu backend: docentesService.delete(cedula)
                Swal.fire('Eliminado', 'El registro ha sido borrado.', 'success');
            }
        });
    };

    // --- LÓGICA DE FILTRADO Y PAGINACIÓN ---
    const filtrados = profesores.filter(p => 
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.cedula.toString().includes(searchTerm)
    );

    const limit = entriesPerPage === 'all' ? filtrados.length : parseInt(entriesPerPage);
    const totalPages = Math.ceil(filtrados.length / limit);
    const safePage = currentPage > totalPages ? 1 : currentPage;
    const currentItems = filtrados.slice((safePage - 1) * limit, (safePage - 1) * limit + limit);

    const recargarDatos = () => {
        setLoading(true);
        cargarProfesores();
    }

    if (!user) return null;

    return (
        <main className="main-content">
            <Menu user={user} />
            <div className="content-wrapper" style={{ width: '100%' }}>
                <Header title="Gestión de Docentes" user={user} onLogout={() => navigate('/login')} />
                
                <div className="view active">
                    <div className="view-header">
                        <div className="search-box">
                            <i className="fa fa-search"></i>
                            <input type="text" placeholder="Buscar por nombre o cédula..." 
                                    value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}} />
                        </div>
                        <button className="btn-primary" onClick={openAddModal}>
                            <i className="fa fa-user-plus"></i> Agregar Nuevo Profesor
                        </button>
                    </div>

                    <div className="pagination-controls">
                        <div className="entries-control">
                            <label>Mostrar:</label>
                            <select className="entries-select" value={entriesPerPage} 
                                    onChange={(e) => {setEntriesPerPage(e.target.value); setCurrentPage(1);}}>
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="all">Todos</option>
                            </select>
                            <span>profesores</span>
                            <button onClick={recargarDatos} className='btn-secondary'> <i className='fa fa-rotate'></i> Actualizar</button>
                        </div>
                        <div className="pagination-info">
                            Mostrando {currentItems.length} de {filtrados.length} resultados
                        </div>
                    </div>

                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Profesor</th>
                                    <th>Cédula</th>
                                    <th>Especialidad</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="5" style={{textAlign: 'center'}}>Cargando datos...</td></tr>
                                ) : currentItems.length > 0 ? (
                                    currentItems.map(p => (
                                        <tr key={p.cedula} className="profesor-row">
                                            <td>{p.nombre} {p.apellido}</td>
                                            <td>{p.cedula}</td>
                                            <td>{p.especializacion}</td>
                                            <td>
                                                <span className={`status-badge ${p.activo === 1 ? 'status-active' : 'status-inactive'}`}>
                                                    {p.activo === 1 ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="table-actions">
                                                    <button className="btns btn-edit" onClick={() => openEditModal(p)} title="Editar"><i className="fa fa-edit"></i></button>
                                                    <button className="btns btn-delete" onClick={() => handleDelete(p.cedula)} title="Eliminar"><i className="fa fa-trash"></i></button>
                                                    <button className="btns btn-view" onClick={() => openViewModal(p)} title="Ver detalles"><i className="fa fa-eye"></i></button>
                                                    <button className="btns btn-permi" title="Permisos"><i className="fa fa-book"></i></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="5" style={{textAlign: 'center'}}>No se encontraron coincidencias.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINACIÓN */}
                    {entriesPerPage !== 'all' && totalPages > 1 && (
                        <div className="pagination-buttons">
                            <button className="btns" disabled={safePage === 1} onClick={() => setCurrentPage(safePage - 1)}>
                                <i className="fa fa-chevron-left"></i> Anterior
                            </button>
                            {[...Array(totalPages)].map((_, i) => (
                                <button key={i} className={`btns ${safePage === i + 1 ? 'btn-primary' : ''}`} 
                                        onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                            ))}
                            <button className="btns" disabled={safePage === totalPages} onClick={() => setCurrentPage(safePage + 1)}>
                                Siguiente <i className="fa fa-chevron-right"></i>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL FORMULARIO (ADD/EDIT) */}
            {showFormModal && (
                <div className="modal-overlay active" onClick={() => setShowFormModal(false)}>
                    <div className="modal-add" onClick={e => e.stopPropagation()}>
                        <button className="btn-cerrar" onClick={() => setShowFormModal(false)}>&times;</button>
                        <h2>{isEditMode ? 'Editar Profesor' : 'Agregar Nuevo Profesor'}</h2>
                        <form action={isEditMode ? "/updateProfe" : "/envioProfe"} method="POST" onSubmit={validateBeforeSubmit}>
                            <input type="hidden" name="cedula_og" value={formData.cedula_og} />
                            <div className="form-group">
                                <label>Cédula:</label>
                                <input type="text" name="cedula" value={formData.cedula} onChange={handleChange} required />
                            </div>
                            <div style={{display:'flex', gap:'15px'}}>
                                <div className="form-group" style={{flex:1}}>
                                    <label>Nombres:</label>
                                    <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required />
                                </div>
                                <div className="form-group" style={{flex:1}}>
                                    <label>Apellidos:</label>
                                    <input type="text" name="apellido" value={formData.apellido} onChange={handleChange} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Correo Electrónico:</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Especialidad:</label>
                                <select name="especialidad" value={formData.especialidad} onChange={handleChange}>
                                    <option value="ingeniero">Ingeniero/a</option>
                                    <option value="lic_educacion">Licenciado/a</option>
                                    <option value="doctor">Doctorado</option>
                                </select>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowFormModal(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary">Guardar Profesor</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL VER INFORMACIÓN */}
            {showViewModal && (
                <div className="modal-overlay active" onClick={() => setShowViewModal(false)}>
                    <div className="modal-edit" onClick={e => e.stopPropagation()}>
                        <button className="btn-cerrar" onClick={() => setShowViewModal(false)}>&times;</button>
                        <h2>Detalles del Docente</h2>
                        <div style={{padding: '32px'}}>
                            <div className="docente-info" style={{flexDirection: 'column', gap: '10px'}}>
                                <div style={{background: 'white', width: '70px', height: '70px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', textAlign: 'center', marginBottom: '20px'}}>
                                    <i className="fa fa-user" style={{fontSize: '35px', color: '#2196F3'}}></i>
                                </div>
                                <div className="info-item">
                                    <strong>Nombre:</strong> 
                                    <span>{formData.nombre} {formData.apellido}</span>
                                </div>
                                <div className="info-item">
                                    <strong>Cédula:</strong> 
                                    <span>{formData.cedula}</span>
                                </div>
                                <div className="info-item">
                                    <strong>Email:</strong>
                                    <span>{formData.email}</span>
                                </div>
                                <div className="info-item">
                                    <strong>Telefono:</strong>
                                    <span>{formData.telefono}</span>
                                </div>
                                <div className="info-item">
                                    <strong>Especialidad:</strong> 
                                    <span>{formData.especializacion || formData.especialidad}</span>
                                </div>
                                <div className="info-item">
                                    <strong>Decripcion:</strong> <br/>
                                    <span>{formData.descripcion}</span>
                                </div><br />
                                <div className="info-item">
                                    <strong>Estado:</strong> 
                                    <span>{formData.activo == 1 ? 'Activo' : 'Inactivo'}</span>
                                </div>
                            </div>
                            <button className="btn btn-primary" onClick={() => setShowViewModal(false)} style={{width:'100%', marginTop:'20px'}}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}