import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Menu from '../components/menu';
import Header from '../components/header';
import { useUI } from '../context/UIContext';
import '../assets/css/home.css';
import '../assets/css/guias.css';

export default function AdminGuias() {
    const navigate = useNavigate();
    const { setLoading: setGlobalLoading } = useUI();
    const [user] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    const [activeTab, setActiveTab] = useState('admin'); // 'admin', 'docente', 'estudiante'
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSection, setActiveSection] = useState('periodos');
    const [openFaq, setOpenFaq] = useState({});

    useEffect(() => {
        setGlobalLoading(false);
        const token = localStorage.getItem('token');
        if (!user || !token) {
            navigate('/login');
        } else if (user.id_rol !== 1) {
            navigate('/login');
        }
    }, [navigate, user, setGlobalLoading]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/login');
    };

    const scrollToSection = (id) => {
        setActiveSection(id);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const toggleFaq = (index) => {
        setOpenFaq(prev => ({ ...prev, [index]: !prev[index] }));
    };

    if (!user) return null;

    // Secciones por pestaña
    const adminSections = [
        { id: 'periodos', title: 'Periodos Académicos', icon: 'fas fa-calendar-alt' },
        { id: 'docentes', title: 'Directorio Docente', icon: 'fas fa-chalkboard-teacher' },
        { id: 'permisos', title: 'Permisos Docentes Granulares', icon: 'fas fa-key' },
        { id: 'usuarios', title: 'Gestión de Usuarios y Roles', icon: 'fas fa-users-cog' },
        { id: 'rubricas', title: 'Banco de Rúbricas Institucional', icon: 'fas fa-table' },
        { id: 'evaluacion-docente', title: 'Evaluación y Desempeño Docente', icon: 'fas fa-tasks' },
        { id: 'reportes', title: 'Reportes Consolidados', icon: 'fas fa-chart-pie' },
        { id: 'recomendaciones-admin', title: 'Recomendaciones para Administradores', icon: 'fas fa-lightbulb' }
    ];

    const teacherSections = [
        { id: 'teacher-intro', title: 'Panel Docente', icon: 'fas fa-chalkboard-teacher' },
        { id: 'teacher-rubricas', title: 'Diseño y Ponderación al 100%', icon: 'fas fa-table' },
        { id: 'teacher-evaluaciones', title: 'Planificación de Evaluaciones', icon: 'fas fa-clipboard-list' },
        { id: 'teacher-calificar', title: 'Matriz de Calificación Interactiva', icon: 'fas fa-check-double' },
        { id: 'teacher-reportes', title: 'Actas PDF y Excel', icon: 'fas fa-file-export' }
    ];

    const studentSections = [
        { id: 'student-intro', title: 'Panel Estudiantil', icon: 'fas fa-home' },
        { id: 'student-calificaciones', title: 'Desglose por Rúbrica', icon: 'fas fa-graduation-cap' },
        { id: 'student-evaluaciones', title: 'Evaluaciones y Cronograma', icon: 'fas fa-clipboard-check' },
        { id: 'student-perfil', title: 'Seguridad y Perfil', icon: 'fas fa-user-shield' }
    ];

    const currentSections = activeTab === 'admin' 
        ? adminSections 
        : activeTab === 'docente' 
            ? teacherSections 
            : studentSections;

    const filterMatches = (text) => {
        if (!searchQuery.trim()) return true;
        return text.toLowerCase().includes(searchQuery.toLowerCase());
    };

    return (
        <main className="main-content">
            <Menu user={user} />
            <div className="content-wrapper" style={{ width: '100%' }}>
                <Header title="Centro de Documentación y Guías" user={user} onLogout={handleLogout} />

                <div className="guide-container">
                    {/* Hero Banner */}
                    <div className="guide-hero">
                        <div className="guide-hero-content">
                            <span className="guide-badge-role">
                                <i className="fas fa-shield-alt"></i> Módulo de Administración Global
                            </span>
                            <h1><i className="fas fa-book-open"></i> Centro de Manuales y Guías de SYSRUBR</h1>
                            <p>
                                Como <strong>Administrador del Sistema</strong>, tienes acceso completo a la guía de administración general para la gestión de periodos, docentes, permisos, usuarios y auditoría institucional, así como a las guías de Docentes y Estudiantes.
                            </p>

                            <div className="guide-search-wrapper">
                                <i className="fas fa-search guide-search-icon"></i>
                                <input
                                    type="text"
                                    className="guide-search-input"
                                    placeholder="Buscar en manuales (ej. periodos, permisos docente, contraseñas, reportes)..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <button className="guide-search-clear" onClick={() => setSearchQuery('')}>
                                        <i className="fas fa-times"></i>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Selector de Pestañas por Rol */}
                    <div className="guide-tabs-container">
                        <button
                            className={`guide-tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('admin'); setActiveSection('periodos'); }}
                        >
                            <i className="fas fa-user-shield"></i>
                            <span>1. Guía de Administración (Exclusiva)</span>
                        </button>
                        <button
                            className={`guide-tab-btn ${activeTab === 'docente' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('docente'); setActiveSection('teacher-intro'); }}
                        >
                            <i className="fas fa-chalkboard-teacher"></i>
                            <span>2. Guía del Docente (Vista Admin)</span>
                        </button>
                        <button
                            className={`guide-tab-btn ${activeTab === 'estudiante' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('estudiante'); setActiveSection('student-intro'); }}
                        >
                            <i className="fas fa-user-graduate"></i>
                            <span>3. Guía del Estudiante (Vista Admin)</span>
                        </button>
                    </div>

                    {/* Layout Principal */}
                    <div className="guide-main-layout">
                        {/* Menú Lateral Flotante */}
                        <aside className="guide-sidebar-toc">
                            <div className="guide-toc-title">
                                <i className="fas fa-list-ul"></i> Temas del Módulo
                            </div>
                            <ul className="guide-toc-list">
                                {currentSections.map(sec => (
                                    <li key={sec.id}>
                                        <button
                                            className={`guide-toc-link ${activeSection === sec.id ? 'active' : ''}`}
                                            onClick={() => scrollToSection(sec.id)}
                                        >
                                            <i className={sec.icon}></i>
                                            <span>{sec.title}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </aside>

                        {/* Cuerpo de Contenido Dinámico según la Pestaña */}
                        <div className="guide-content-body">
                            {/* =========================================================================
                                PESTAÑA 1: MÓDULO EXCLUSIVO DE ADMINISTRACIÓN
                               ========================================================================= */}
                            {activeTab === 'admin' && (
                                <>
                                    {/* Sección: Periodos Académicos */}
                                    {filterMatches('periodos academicos lapso apertura cierre periodo activo selector') && (
                                        <section className="guide-section" id="periodos">
                                            <div className="guide-section-header">
                                                <div className="guide-section-icon">
                                                    <i className="fas fa-calendar-alt"></i>
                                                </div>
                                                <div>
                                                    <h2>1. Gestión de Periodos Académicos</h2>
                                                    <span className="guide-badge guide-badge-blue">Configuración Global</span>
                                                </div>
                                            </div>
                                            <p className="guide-section-lead">
                                                Los periodos académicos (ej. 2026-I, 2026-II) rigen las fechas de validez de rúbricas, evaluaciones y reportes en toda la institución.
                                            </p>

                                            <div className="guide-steps-grid">
                                                <div className="guide-step-card">
                                                    <div className="guide-step-num">1</div>
                                                    <div className="guide-step-title">Crear Nuevo Periodo</div>
                                                    <p className="guide-step-desc">
                                                        Define el código institucional del periodo (ej: <strong>2026-I</strong>), fecha de inicio y fecha de culminación.
                                                    </p>
                                                </div>
                                                <div className="guide-step-card">
                                                    <div className="guide-step-num">2</div>
                                                    <div className="guide-step-title">Establecer Periodo Activo</div>
                                                    <p className="guide-step-desc">
                                                        Solo un periodo puede estar en estado <strong>Activo</strong> simultáneamente. Todo el sistema filtrará las actividades según este lapso.
                                                    </p>
                                                </div>
                                                <div className="guide-step-card">
                                                    <div className="guide-step-num">3</div>
                                                    <div className="guide-step-title">Conmutador en Cabecera</div>
                                                    <p className="guide-step-desc">
                                                        El selector superior en el header te permite auditar periodos pasados o seleccionar "Todos" en el módulo de reportes.
                                                    </p>
                                                </div>
                                            </div>

                                            <button onClick={() => navigate('/admin/periodos')} className="guide-action-btn">
                                                <i className="fas fa-calendar-alt"></i> Ir a Periodos Académicos
                                            </button>
                                        </section>
                                    )}

                                    {/* Sección: Directorio Docente */}
                                    {filterMatches('docentes profesores registro asignacion materias secciones carga academica') && (
                                        <section className="guide-section" id="docentes">
                                            <div className="guide-section-header">
                                                <div className="guide-section-icon">
                                                    <i className="fas fa-chalkboard-teacher"></i>
                                                </div>
                                                <div>
                                                    <h2>2. Directorio y Asignación Docente</h2>
                                                    <span className="guide-badge guide-badge-blue">Carga Académica</span>
                                                </div>
                                            </div>
                                            <p className="guide-section-lead">
                                                Administra el cuerpo docente institucional, registra nuevos profesores y asígnales sus respectivas unidades curriculares y secciones.
                                            </p>

                                            <div className="guide-steps-grid">
                                                <div className="guide-step-card">
                                                    <div className="guide-step-num"><i className="fas fa-user-plus"></i></div>
                                                    <div className="guide-step-title">Registro de Docentes</div>
                                                    <p className="guide-step-desc">
                                                        Ingresa nombres, apellidos, cédula, correo institucional y teléfono de contacto.
                                                    </p>
                                                </div>

                                                <div className="guide-step-card">
                                                    <div className="guide-step-num"><i className="fas fa-book"></i></div>
                                                    <div className="guide-step-title">Asignación de Asignaturas</div>
                                                    <p className="guide-step-desc">
                                                        Vincula al docente con una o múltiples materias y sus códigos de sección correspondientes.
                                                    </p>
                                                </div>

                                                <div className="guide-step-card">
                                                    <div className="guide-step-num"><i className="fas fa-toggle-on"></i></div>
                                                    <div className="guide-step-title">Control de Estatus</div>
                                                    <p className="guide-step-desc">
                                                        Activa o suspende el acceso de un docente de manera inmediata con el conmutador de estado.
                                                    </p>
                                                </div>
                                            </div>

                                            <button onClick={() => navigate('/admin/profesores')} className="guide-action-btn">
                                                <i className="fas fa-chalkboard-teacher"></i> Ir a Docentes
                                            </button>
                                        </section>
                                    )}

                                    {/* Sección: Permisos Granulares */}
                                    {filterMatches('permisos docentes granulares crear rubricas evaluar modificar exportar') && (
                                        <section className="guide-section" id="permisos">
                                            <div className="guide-section-header">
                                                <div className="guide-section-icon">
                                                    <i className="fas fa-key"></i>
                                                </div>
                                                <div>
                                                    <h2>3. Control Granular de Permisos Docente</h2>
                                                    <span className="guide-badge guide-badge-purple">Seguridad y Políticas</span>
                                                </div>
                                            </div>
                                            <p className="guide-section-lead">
                                                SYSRUBR incluye un potente motor de permisos por docente, permitiendo restringir o facultar acciones según el perfil del profesor.
                                            </p>

                                            <div className="guide-table-responsive">
                                                <table className="guide-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Permiso</th>
                                                            <th>Descripción</th>
                                                            <th>Impacto en el Sistema</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td><strong>Crear Rúbricas</strong></td>
                                                            <td>Permite al docente diseñar sus propios instrumentos.</td>
                                                            <td>Si está inactivo, el docente solo usará rúbricas asignadas por la coordinación.</td>
                                                        </tr>
                                                        <tr>
                                                            <td><strong>Evaluar / Calificar</strong></td>
                                                            <td>Habilita el asentamiento de notas por rúbrica.</td>
                                                            <td>Permite aplicar matrices de evaluación a sus secciones asignadas.</td>
                                                        </tr>
                                                        <tr>
                                                            <td><strong>Modificar Evaluaciones</strong></td>
                                                            <td>Permite editar notas ya asentadas previamente.</td>
                                                            <td>Útil para periodos de corrección o reclamos académicos.</td>
                                                        </tr>
                                                        <tr>
                                                            <td><strong>Exportar Reportes</strong></td>
                                                            <td>Descarga de actas en formatos PDF y Excel.</td>
                                                            <td>Controla la generación autónoma de actas institucionales.</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>

                                            <div className="guide-callout guide-callout-warning">
                                                <i className="fas fa-exclamation-triangle"></i>
                                                <div>
                                                    <strong>Cómo configurar:</strong> Desde la lista de docentes en <em>/admin/profesores</em>, haz clic en el botón de candado / permisos <i className="fas fa-key text-warning"></i> para abrir el panel de permisos individuales.
                                                </div>
                                            </div>
                                        </section>
                                    )}

                                    {/* Sección: Usuarios y Seguridad */}
                                    {filterMatches('usuarios roles configuracion contrasena restablecer seguridad cuentas') && (
                                        <section className="guide-section" id="usuarios">
                                            <div className="guide-section-header">
                                                <div className="guide-section-icon">
                                                    <i className="fas fa-users-cog"></i>
                                                </div>
                                                <div>
                                                    <h2>4. Gestión de Usuarios y Roles</h2>
                                                    <span className="guide-badge guide-badge-blue">Cuentas y Accesos</span>
                                                </div>
                                            </div>
                                            <p className="guide-section-lead">
                                                Administración centralizada de cuentas de usuario, asignación de roles (Administrador, Docente, Estudiante) y restablecimiento de credenciales de acceso.
                                            </p>

                                            <div className="guide-steps-grid">
                                                <div className="guide-step-card">
                                                    <div className="guide-step-num"><i className="fas fa-user-tag"></i></div>
                                                    <div className="guide-step-title">Cambio de Roles</div>
                                                    <p className="guide-step-desc">
                                                        Modifica el nivel de acceso de cualquier usuario entre Administrador (1), Docente (2) o Estudiante (3).
                                                    </p>
                                                </div>

                                                <div className="guide-step-card">
                                                    <div className="guide-step-num"><i className="fas fa-sync-alt"></i></div>
                                                    <div className="guide-step-title">Restablecer Contraseñas</div>
                                                    <p className="guide-step-desc">
                                                        Genera o asigna una nueva contraseña a usuarios que hayan olvidado sus credenciales institucionales.
                                                    </p>
                                                </div>
                                            </div>

                                            <button onClick={() => navigate('/admin/configuracion')} className="guide-action-btn">
                                                <i className="fas fa-cog"></i> Ir a Configuración de Usuarios
                                            </button>
                                        </section>
                                    )}

                                    {/* Sección: Banco de Rúbricas */}
                                    {filterMatches('rubricas institucional banco rubricas matriz criterios auditoria') && (
                                        <section className="guide-section" id="rubricas">
                                            <div className="guide-section-header">
                                                <div className="guide-section-icon">
                                                    <i className="fas fa-table"></i>
                                                </div>
                                                <div>
                                                    <h2>5. Banco de Rúbricas Institucional</h2>
                                                    <span className="guide-badge guide-badge-blue">Calidad Académica</span>
                                                </div>
                                            </div>
                                            <p className="guide-section-lead">
                                                Supervisa todos los instrumentos de evaluación creados en la institución, filtra por materia, previsualiza matrices y crea rúbricas estandarizadas modelo.
                                            </p>

                                            <button onClick={() => navigate('/admin/rubricas')} className="guide-action-btn">
                                                <i className="fas fa-table"></i> Ir a Rúbricas Institucionales
                                            </button>
                                        </section>
                                    )}

                                    {/* Sección: Evaluación Docente */}
                                    {filterMatches('evaluacion docente supervision pedagogica control calidad desempeno') && (
                                        <section className="guide-section" id="evaluacion-docente">
                                            <div className="guide-section-header">
                                                <div className="guide-section-icon">
                                                    <i className="fas fa-tasks"></i>
                                                </div>
                                                <div>
                                                    <h2>6. Evaluación y Desempeño Docente</h2>
                                                    <span className="guide-badge guide-badge-purple">Supervisión</span>
                                                </div>
                                            </div>
                                            <p className="guide-section-lead">
                                                Módulo especializado para el registro y auditoría del desempeño pedagógico de los profesores, cumplimiento de entregas y puntualidad evaluativa.
                                            </p>

                                            <button onClick={() => navigate('/admin/evaluacion-docente')} className="guide-action-btn">
                                                <i className="fas fa-tasks"></i> Ir a Evaluación Docente
                                            </button>
                                        </section>
                                    )}

                                    {/* Sección: Reportes Consolidados */}
                                    {filterMatches('reportes consolidados estadisticas pdf excel exportar institucionales promedios') && (
                                        <section className="guide-section" id="reportes">
                                            <div className="guide-section-header">
                                                <div className="guide-section-icon">
                                                    <i className="fas fa-chart-pie"></i>
                                                </div>
                                                <div>
                                                    <h2>7. Reportes Consolidados e Inteligencia Académica</h2>
                                                    <span className="guide-badge guide-badge-excel">Estadísticas</span>
                                                </div>
                                            </div>
                                            <p className="guide-section-lead">
                                                Generación masiva de estadísticas de rendimiento estudiantil, índices de aprobación por materia y actas consolidadas institucionales.
                                            </p>

                                            <div className="guide-steps-grid">
                                                <div className="guide-step-card">
                                                    <div className="guide-step-num"><i className="fas fa-file-pdf text-danger"></i></div>
                                                    <div className="guide-step-title">Reportes en PDF</div>
                                                    <p className="guide-step-desc">
                                                        Informes ejecutivos con diagramas y actas formales listos para archivar o imprimir.
                                                    </p>
                                                </div>
                                                <div className="guide-step-card">
                                                    <div className="guide-step-num"><i className="fas fa-file-excel text-success"></i></div>
                                                    <div className="guide-step-title">Consolidado en Excel</div>
                                                    <p className="guide-step-desc">
                                                        Tablas dinámicas completas con todas las secciones, docentes y notas del periodo.
                                                    </p>
                                                </div>
                                            </div>

                                            <button onClick={() => navigate('/admin/reportes')} className="guide-action-btn">
                                                <i className="fas fa-file-alt"></i> Ir a Reportes Globales
                                            </button>
                                        </section>
                                    )}

                                    {/* Sección: Recomendaciones para Administradores */}
                                    {filterMatches('recomendaciones admin selector periodos barra superior filtro dudas administracion') && (
                                        <section className="guide-section" id="recomendaciones-admin">
                                            <div className="guide-section-header">
                                                <div className="guide-section-icon">
                                                    <i className="fas fa-lightbulb"></i>
                                                </div>
                                                <div>
                                                    <h2>8. Recomendaciones para Administradores</h2>
                                                    <span className="guide-badge guide-badge-amber">Buenas Prácticas</span>
                                                </div>
                                            </div>

                                            <div className="guide-callout guide-callout-tip">
                                                <i className="fas fa-check-circle"></i>
                                                <div>
                                                    <strong>Consejo Institucional:</strong> Antes de aperturar un nuevo periodo de evaluaciones, asegúrate de verificar que todos los docentes tengan asignadas sus asignaturas y secciones correspondientes en el módulo de <em>Docentes</em>.
                                                </div>
                                            </div>

                                            <div className="guide-faq-list">
                                                <div className={`guide-faq-item ${openFaq['a0'] !== false ? 'open' : ''}`}>
                                                    <button className="guide-faq-question" onClick={() => toggleFaq('a0')}>
                                                        <span>¿Para qué sirve el selector de periodos en la barra superior del Administrador?</span>
                                                        <i className="fas fa-chevron-down"></i>
                                                    </button>
                                                    {openFaq['a0'] !== false && (
                                                        <div className="guide-faq-answer">
                                                            El selector de periodos ubicado en el encabezado superior actúa como un <strong>filtro global interactivo</strong>. Al elegir un periodo (por ejemplo, <em>2026-I</em> o <em>Todos</em> en reportes), todos los módulos del sistema actualizan instantáneamente sus datos, listados de rúbricas, evaluaciones y reportes para mostrar exclusivamente la información perteneciente a dicho lapso. Esto te permite auditar y consultar historiales académicos pasados en tiempo real sin alterar la configuración del periodo activo institucional.
                                                        </div>
                                                    )}
                                                </div>

                                                <div className={`guide-faq-item ${openFaq['a1'] ? 'open' : ''}`}>
                                                    <button className="guide-faq-question" onClick={() => toggleFaq('a1')}>
                                                        <span>¿Cómo cambiar el periodo activo al iniciar un nuevo semestre?</span>
                                                        <i className="fas fa-chevron-down"></i>
                                                    </button>
                                                    {openFaq['a1'] && (
                                                        <div className="guide-faq-answer">
                                                            Ingresa a <strong>/admin/periodos</strong>, crea el nuevo lapso si aún no existe y haz clic en <strong>"Establecer como Activo"</strong>. De manera automática, todos los módulos de docentes y estudiantes sincronizarán sus actividades operativas al nuevo lapso.
                                                        </div>
                                                    )}
                                                </div>

                                                <div className={`guide-faq-item ${openFaq['a2'] ? 'open' : ''}`}>
                                                    <button className="guide-faq-question" onClick={() => toggleFaq('a2')}>
                                                        <span>¿Qué ocurre si desactivo un docente?</span>
                                                        <i className="fas fa-chevron-down"></i>
                                                    </button>
                                                    {openFaq['a2'] && (
                                                        <div className="guide-faq-answer">
                                                            El docente no podrá iniciar sesión en la plataforma mientras su estado sea inactivo. Sin embargo, su historial de rúbricas, evaluaciones y actas emitidas se preservará intacto en la base de datos para auditoría institucional.
                                                        </div>
                                                    )}
                                                </div>

                                                <div className={`guide-faq-item ${openFaq['a3'] ? 'open' : ''}`}>
                                                    <button className="guide-faq-question" onClick={() => toggleFaq('a3')}>
                                                        <span>¿Cómo restringir a un docente para que solo use rúbricas institucionales?</span>
                                                        <i className="fas fa-chevron-down"></i>
                                                    </button>
                                                    {openFaq['a3'] && (
                                                        <div className="guide-faq-answer">
                                                            Dirígete a <strong>/admin/profesores</strong>, ubica al docente y haz clic en el botón de permisos (candado). Desmarca la opción <em>"Crear Rúbricas"</em> y guarda los cambios. El docente podrá evaluar pero solo con las rúbricas preaprobadas por la coordinación.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </section>
                                    )}
                                </>
                            )}

                            {/* =========================================================================
                                PESTAÑA 2: VISTA DE LA GUÍA DEL DOCENTE (PARA EL ADMIN)
                               ========================================================================= */}
                            {activeTab === 'docente' && (
                                <>
                                    <div className="guide-callout guide-callout-info">
                                        <i className="fas fa-info-circle"></i>
                                        <div>
                                            <strong>Vista de Referencia Docente:</strong> Este es el manual que consultan los profesores. Te permite orientarlos en el diseño de rúbricas, ponderación al 100% y evaluación interactiva.
                                        </div>
                                    </div>

                                    <section className="guide-section" id="teacher-intro">
                                        <div className="guide-section-header">
                                            <div className="guide-section-icon"><i className="fas fa-chalkboard-teacher"></i></div>
                                            <div>
                                                <h2>Panel del Profesor</h2>
                                                <span className="guide-badge guide-badge-blue">Módulo Docente</span>
                                            </div>
                                        </div>
                                        <p className="guide-section-lead">
                                            Los profesores tienen acceso a sus métricas de rúbricas creadas, evaluaciones asignadas por calificar y cómputo de estudiantes evaluados.
                                        </p>
                                    </section>

                                    <section className="guide-section" id="teacher-rubricas">
                                        <div className="guide-section-header">
                                            <div className="guide-section-icon"><i className="fas fa-table"></i></div>
                                            <div>
                                                <h2>Creación de Rúbricas y Validación al 100%</h2>
                                                <span className="guide-badge guide-badge-purple">Pedagogía</span>
                                            </div>
                                        </div>
                                        <p className="guide-section-lead">
                                            El docente estructura criterios y niveles de desempeño (Sobresaliente, Notable, Aprobado, Insuficiente) garantizando que la suma de ponderaciones porcentuales sea exactamente 100%.
                                        </p>
                                    </section>

                                    <section className="guide-section" id="teacher-evaluaciones">
                                        <div className="guide-section-header">
                                            <div className="guide-section-icon"><i className="fas fa-clipboard-list"></i></div>
                                            <div>
                                                <h2>Planificación de Evaluaciones</h2>
                                                <span className="guide-badge guide-badge-blue">Planificación</span>
                                            </div>
                                        </div>
                                        <p className="guide-section-lead">
                                            Vinculación de rúbricas a materias, secciones académicas y fechas límites de entrega.
                                        </p>
                                    </section>

                                    <section className="guide-section" id="teacher-calificar">
                                        <div className="guide-section-header">
                                            <div className="guide-section-icon"><i className="fas fa-check-double"></i></div>
                                            <div>
                                                <h2>Matriz de Calificación Interactiva</h2>
                                                <span className="guide-badge guide-badge-excel">Evaluación</span>
                                            </div>
                                        </div>
                                        <p className="guide-section-lead">
                                            Calificación rápida haciendo clic en cada nivel por criterio, con cómputo automático de la nota sobre 20 y campo para observaciones cualitativas.
                                        </p>
                                    </section>

                                    <section className="guide-section" id="teacher-reportes">
                                        <div className="guide-section-header">
                                            <div className="guide-section-icon"><i className="fas fa-file-export"></i></div>
                                            <div>
                                                <h2>Actas y Reportes PDF / Excel</h2>
                                                <span className="guide-badge guide-badge-excel">Exportación</span>
                                            </div>
                                        </div>
                                        <p className="guide-section-lead">
                                            Exportación de actas firmadas en PDF y sábanas de notas en Excel por sección evaluada.
                                        </p>
                                    </section>
                                </>
                            )}

                            {/* =========================================================================
                                PESTAÑA 3: VISTA DE LA GUÍA DEL ESTUDIANTE (PARA EL ADMIN)
                               ========================================================================= */}
                            {activeTab === 'estudiante' && (
                                <>
                                    <div className="guide-callout guide-callout-info">
                                        <i className="fas fa-info-circle"></i>
                                        <div>
                                            <strong>Vista de Referencia Estudiantil:</strong> Este es el manual que consultan los alumnos. Útil para brindar soporte técnico y resolver dudas sobre la consulta de calificaciones y rúbricas.
                                        </div>
                                    </div>

                                    <section className="guide-section" id="student-intro">
                                        <div className="guide-section-header">
                                            <div className="guide-section-icon"><i className="fas fa-home"></i></div>
                                            <div>
                                                <h2>Panel Estudiantil</h2>
                                                <span className="guide-badge guide-badge-blue">Módulo Estudiante</span>
                                            </div>
                                        </div>
                                        <p className="guide-section-lead">
                                            Muestra al estudiante su promedio acumulado, evaluaciones pendientes y calificaciones recientes.
                                        </p>
                                    </section>

                                    <section className="guide-section" id="student-calificaciones">
                                        <div className="guide-section-header">
                                            <div className="guide-section-icon"><i className="fas fa-graduation-cap"></i></div>
                                            <div>
                                                <h2>Consulta de Notas y Desglose por Rúbrica</h2>
                                                <span className="guide-badge guide-badge-blue">Transparencia</span>
                                            </div>
                                        </div>
                                        <p className="guide-section-lead">
                                            El estudiante puede pulsar en cualquier evaluación y observar los puntos obtenidos en cada criterio junto a los comentarios del profesor.
                                        </p>
                                    </section>

                                    <section className="guide-section" id="student-evaluaciones">
                                        <div className="guide-section-header">
                                            <div className="guide-section-icon"><i className="fas fa-clipboard-check"></i></div>
                                            <div>
                                                <h2>Próximas Evaluaciones y Vista Previa</h2>
                                                <span className="guide-badge guide-badge-blue">Cronograma</span>
                                            </div>
                                        </div>
                                        <p className="guide-section-lead">
                                            Los alumnos revisan con antelación las fechas límites y la rúbrica que se utilizará para evaluarlos.
                                        </p>
                                    </section>

                                    <section className="guide-section" id="student-perfil">
                                        <div className="guide-section-header">
                                            <div className="guide-section-icon"><i className="fas fa-user-shield"></i></div>
                                            <div>
                                                <h2>Perfil y Seguridad</h2>
                                                <span className="guide-badge guide-badge-blue">Cuenta</span>
                                            </div>
                                        </div>
                                        <p className="guide-section-lead">
                                            Módulo para que los estudiantes actualicen su contraseña de acceso institucional.
                                        </p>
                                    </section>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
