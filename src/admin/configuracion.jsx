import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Menu from '../components/menu';
import Header from '../components/header';
import Swal from 'sweetalert2';
import { usuariosService } from '../services/usuarios.service';
import '../assets/css/home.css';
import '../assets/css/modalConfig.css';

export default function Configuracion() {
    const navigate = useNavigate();
    const [user] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // Modales y Formularios
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [formData, setFormData] = useState({
        cedula: '',
        nombre: '',
        apellido: '',
        email: '',
        password: '',
        rol: ''
    });
    const [editingCedula, setEditingCedula] = useState(null);

    const loadUsuarios = async () => {
        try {
            const data = await usuariosService.getUsuarios();
            setUsuarios(data);
            setLoading(false);
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) {
            navigate('/login');
        } else {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            loadUsuarios();
        }
    }, [user, navigate]);

    // Lógica de Filtrado y Paginación
    const filteredUsuarios = useMemo(() => {
        return usuarios.filter(u => 
            u.cedula.toString().includes(searchTerm) ||
            u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (u.apeliido || u.apellido || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [usuarios, searchTerm]);

    const totalPages = Math.ceil(filteredUsuarios.length / entriesPerPage);
    const currentEntries = useMemo(() => {
        const lastIndex = currentPage * entriesPerPage;
        const firstIndex = lastIndex - entriesPerPage;
        return filteredUsuarios.slice(firstIndex, lastIndex);
    }, [filteredUsuarios, currentPage, entriesPerPage]);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleEntriesChange = (e) => {
        setEntriesPerPage(e.target.value === 'todos' ? usuarios.length : parseInt(e.target.value));
        setCurrentPage(1);
    };

    // Funciones CRUD
    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const openAddModal = () => {
        setFormData({ cedula: '', nombre: '', apellido: '', email: '', password: '', rol: '' });
        setShowAddModal(true);
    };

    const openEditModal = (u) => {
        setEditingCedula(u.cedula);
        setFormData({
            cedula: u.cedula,
            nombre: u.nombre,
            apellido: u.apeliido || u.apellido || '',
            email: u.email,
            password: '',
            rol: u.id_rol.toString()
        });
        setShowEditModal(true);
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        try {
            const result = await usuariosService.createUsuario(formData);
            if (result.status === 'ok') {
                Swal.fire('Éxito', 'Usuario agregado correctamente', 'success');
                setShowAddModal(false);
                loadUsuarios();
            } else {
                Swal.fire('Error', result.mensaje || 'Error al agregar usuario', 'error');
            }
        } catch {
            Swal.fire('Error', 'Error de conexión', 'error');
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const result = await usuariosService.updateUsuario(editingCedula, formData);
            if (result.status === 'ok') {
                Swal.fire('Éxito', 'Usuario actualizado correctamente', 'success');
                setShowEditModal(false);
                loadUsuarios();
            } else {
                Swal.fire('Error', result.mensaje || 'Error al actualizar usuario', 'error');
            }
        } catch {
            Swal.fire('Error', 'Error de conexión', 'error');
        }
    };

    const handleDelete = (cedula) => {
        Swal.fire({
            title: '¿Eliminar usuario?',
            text: "Esta acción no se puede deshacer.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await usuariosService.deleteUsuario(cedula);
                    Swal.fire('Eliminado', 'El usuario ha sido eliminado.', 'success');
                    loadUsuarios();
                } catch {
                    Swal.fire('Error', 'No se pudo eliminar el usuario', 'error');
                }
            }
        });
    };

    if (!user) return null;

    return (
        <main className="main-content">
            <Menu user={user} />
            <div className="content-wrapper" style={{ width: '100%' }}>
                <Header title="Configuración de Usuarios" user={user} onLogout={() => navigate('/login')} />
                
                <div className="view active" id="config" style={{ padding: '20px' }}>
                    <h2 style={{ marginBottom: '20px' }}>Gestión de Usuarios</h2>
                    
                    <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span>Mostrar:</span>
                            <select onChange={handleEntriesChange} value={entriesPerPage} style={{ padding: '8px 12px', border: '1px solid #ddd', borderRadius: '6px' }}>
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="20">20</option>
                                <option value="todos">Todos</option>
                            </select>
                            <span>usuarios</span>
                        </div>

                        <div className="search-box" style={{ position: 'relative', flex: '1', maxWidth: '400px' }}>
                            <i className="fa fa-search" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }}></i>
                            <input 
                                type="text" 
                                placeholder="Buscar por cédula, nombre o correo..." 
                                value={searchTerm}
                                onChange={handleSearch}
                                style={{ width: '100%', padding: '10px 10px 10px 35px', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                        </div>

                        <button className="btns btn-abrir-modal" onClick={openAddModal} style={{ background: '#3b82f6', color: '#fff', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                            <i className="fa fa-user-plus"></i>
                            Agregar Usuario
                        </button>
                    </div>

                    <div className="table-container" style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#f8fafc' }}>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '15px' }}>Cédula</th>
                                    <th style={{ textAlign: 'left', padding: '15px' }}>Nombre</th>
                                    <th style={{ textAlign: 'left', padding: '15px' }}>Apellido</th>
                                    <th style={{ textAlign: 'left', padding: '15px' }}>Correo</th>
                                    <th style={{ textAlign: 'left', padding: '15px' }}>Rol</th>
                                    <th style={{ textAlign: 'center', padding: '15px' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>Cargando usuarios...</td></tr>
                                ) : currentEntries.length === 0 ? (
                                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>No se encontraron usuarios.</td></tr>
                                ) : currentEntries.map(u => (
                                    <tr key={u.cedula} style={{ borderTop: '1px solid #eee' }}>
                                        <td style={{ padding: '15px' }}>{u.cedula}</td>
                                        <td style={{ padding: '15px' }}>{u.nombre}</td>
                                        <td style={{ padding: '15px' }}>{u.apeliido || u.apellido || '-'}</td>
                                        <td style={{ padding: '15px' }}>{u.email}</td>
                                        <td style={{ padding: '15px' }}>
                                            <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', background: u.id_rol === 1 ? '#fee2e2' : u.id_rol === 2 ? '#dcfce7' : '#dbeafe', color: u.id_rol === 1 ? '#991b1b' : u.id_rol === 2 ? '#166534' : '#1e40af' }}>
                                                {u.id_rol === 1 ? 'Administrador' : u.id_rol === 2 ? 'Docente' : 'Estudiante'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '15px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                                                <button className="btns btn-edit" title="Editar" onClick={() => openEditModal(u)} style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}>
                                                    <i className="fa fa-edit"></i>
                                                </button>
                                                <button className="btns btn-delete" title="Eliminar" onClick={() => handleDelete(u.cedula)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}>
                                                    <i className="fa fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginación */}
                    <div className="pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '20px' }}>
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', background: '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}>
                            <i className="fa fa-chevron-left"></i>
                        </button>
                        <div style={{ display: 'flex', gap: '5px' }}>
                            {[...Array(totalPages)].map((_, i) => (
                                <button key={i} onClick={() => setCurrentPage(i + 1)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', background: currentPage === i + 1 ? '#3b82f6' : '#fff', color: currentPage === i + 1 ? '#fff' : '#000', cursor: 'pointer' }}>
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', background: '#fff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}>
                            <i className="fa fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal Agregar Usuario */}
            {showAddModal && (
            <div className="modal-add-usuarios active">
                <div className="modal-content">
                    <span className="close-btn" onClick={() => setShowAddModal(false)}>&times;</span>
                    <h2>Agregar Nuevo Usuario</h2>
                    <form onSubmit={handleAddSubmit}>
                        <div className="form-group">
                            <label>Cédula:</label>
                            <input type="text" name="cedula" value={formData.cedula} onChange={handleInputChange} required placeholder="Ingrese la cédula" />
                        </div>
                        <div className="form-group">
                            <label>Nombre:</label>
                            <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} required placeholder="Ingrese el nombre" />
                        </div>
                        <div className="form-group">
                            <label>Apellido:</label>
                            <input type="text" name="apellido" value={formData.apellido} onChange={handleInputChange} required placeholder="Ingrese el apellido" />
                        </div>
                        <div className="form-group">
                            <label>Correo:</label>
                            <input type="email" name="email" value={formData.email} onChange={handleInputChange} required placeholder="ejemplo@correo.com" />
                        </div>
                        <div className="form-group">
                            <label>Contraseña:</label>
                            <input type="password" name="password" value={formData.password} onChange={handleInputChange} required placeholder="Ingrese la contraseña" />
                        </div>
                        <div className="form-group">
                            <label>Rol:</label>
                            <select name="rol" value={formData.rol} onChange={handleInputChange} required>
                                <option value="">Seleccione un rol</option>
                                <option value="1">Administrador</option>
                                <option value="2">Docente</option>
                                <option value="3">Estudiante</option>
                            </select>
                        </div>
                        <div className="form-actions">
                            <button type="button" className="btn-cancel" onClick={() => setShowAddModal(false)}>Cancelar</button>
                            <button type="submit" className="btn-submit">Agregar</button>
                        </div>
                    </form>
                </div>
            </div>
            )}

            {/* Modal Editar Usuario */}
            {showEditModal && (
            <div className="modal-edit-usuario active">
                <div className="modal-content">
                    <span className="close-btn" onClick={() => setShowEditModal(false)}>&times;</span>
                    <h2>Editar Usuario</h2>
                    <form onSubmit={handleEditSubmit}>
                        <div className="form-group">
                            <label>Cédula:</label>
                            <input type="text" name="cedula" value={formData.cedula} onChange={handleInputChange} required />
                        </div>
                        <div className="form-group">
                            <label>Nombre:</label>
                            <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} required />
                        </div>
                        <div className="form-group">
                            <label>Apellido:</label>
                            <input type="text" name="apellido" value={formData.apellido} onChange={handleInputChange} required />
                        </div>
                        <div className="form-group">
                            <label>Correo:</label>
                            <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
                        </div>
                        <div className="form-group">
                            <label>Contraseña (opcional):</label>
                            <input type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="Nueva contraseña o deje vacío" />
                        </div>
                        <div className="form-group">
                            <label>Rol:</label>
                            <select name="rol" value={formData.rol} onChange={handleInputChange} required>
                                <option value="1">Administrador</option>
                                <option value="2">Docente</option>
                                <option value="3">Estudiante</option>
                            </select>
                        </div>
                        <div className="form-actions">
                            <button type="button" className="btn-cancel" onClick={() => setShowEditModal(false)}>Cancelar</button>
                            <button type="submit" className="btn-submit">Guardar Cambios</button>
                        </div>
                    </form>
                </div>
            </div>
            )}
        </main>
    );
}
