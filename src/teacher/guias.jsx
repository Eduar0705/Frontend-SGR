import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Menu from '../components/menu';
import Header from '../components/header';
import { useUI } from '../context/UIContext';
import '../assets/css/home.css';
import '../assets/css/guias.css';

export default function TeacherGuias() {
    const navigate = useNavigate();
    const { setLoading: setGlobalLoading } = useUI();
    const [user] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [activeSection, setActiveSection] = useState('introduccion');
    const [openFaq, setOpenFaq] = useState({});

    useEffect(() => {
        setGlobalLoading(false);
        const token = localStorage.getItem('token');
        if (!user || !token) {
            navigate('/login');
        } else if (user.id_rol !== 2 && user.id_rol !== 1) {
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

    const sections = [
        { id: 'introduccion', title: 'Panel Docente', icon: 'fas fa-chalkboard-teacher' },
        { id: 'crear-rubricas', title: 'Diseño de Rúbricas', icon: 'fas fa-table' },
        { id: 'evaluaciones', title: 'Planificar Evaluaciones', icon: 'fas fa-clipboard-list' },
        { id: 'calificar', title: 'Calificar con Rúbrica', icon: 'fas fa-check-double' },
        { id: 'estudiantes', title: 'Gestión de Estudiantes', icon: 'fas fa-users' },
        { id: 'reportes', title: 'Reportes y Actas (PDF/Excel)', icon: 'fas fa-file-export' },
        { id: 'faq', title: 'Preguntas Frecuentes', icon: 'fas fa-question-circle' }
    ];

    const filterMatches = (text) => {
        if (!searchQuery.trim()) return true;
        return text.toLowerCase().includes(searchQuery.toLowerCase());
    };

    return (
        <main className="main-content">
            <Menu user={user} />
            <div className="content-wrapper" style={{ width: '100%' }}>
                <Header title="Manual del Docente" user={user} onLogout={handleLogout} />

                <div className="guide-container">
                    {/* Hero Banner */}
                    <div className="guide-hero">
                        <div className="guide-hero-content">
                            <span className="guide-badge-role">
                                <i className="fas fa-chalkboard-teacher"></i> Módulo del Docente
                            </span>
                            <h1><i className="fas fa-book-open"></i> Guía y Manual Operativo Docente</h1>
                            <p>
                                Domina todas las herramientas de <strong>SYSRUBR</strong>: diseño de rúbricas analíticas, asignación de evaluaciones a secciones, calificación interactiva en tiempo real y exportación de actas académicas en PDF y Excel.
                            </p>

                            <div className="guide-search-wrapper">
                                <i className="fas fa-search guide-search-icon"></i>
                                <input
                                    type="text"
                                    className="guide-search-input"
                                    placeholder="Buscar en el manual (ej. crear rúbrica, 100%, calificar, acta pdf, exportar)..."
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

                    {/* Layout Principal: TOC + Contenido */}
                    <div className="guide-main-layout">
                        {/* Menú de Navegación Rápida */}
                        <aside className="guide-sidebar-toc">
                            <div className="guide-toc-title">
                                <i className="fas fa-list-ul"></i> Contenido del Manual
                            </div>
                            <ul className="guide-toc-list">
                                {sections.map(sec => (
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

                        {/* Cuerpo de Secciones */}
                        <div className="guide-content-body">
                            {/* Sección 1: Panel Docente */}
                            {filterMatches('introduccion panel docente metricas resumen rubricas pendientes estudiantes evaluados') && (
                                <section className="guide-section" id="introduccion">
                                    <div className="guide-section-header">
                                        <div className="guide-section-icon">
                                            <i className="fas fa-chart-line"></i>
                                        </div>
                                        <div>
                                            <h2>1. Panel Principal del Docente</h2>
                                            <span className="guide-badge guide-badge-blue">Dashboard</span>
                                        </div>
                                    </div>
                                    <p className="guide-section-lead">
                                        Tu espacio de trabajo centralizado para supervisar tus actividades académicas del periodo.
                                    </p>

                                    <div className="guide-steps-grid">
                                        <div className="guide-step-card">
                                            <div className="guide-step-num"><i className="fas fa-table"></i></div>
                                            <div className="guide-step-title">Mis Rúbricas</div>
                                            <p className="guide-step-desc">
                                                Total de instrumentos de evaluación creados y disponibles para vincular a tus evaluaciones.
                                            </p>
                                        </div>

                                        <div className="guide-step-card">
                                            <div className="guide-step-num"><i className="fas fa-hourglass-half"></i></div>
                                            <div className="guide-step-title">Por Calificar</div>
                                            <p className="guide-step-desc">
                                                Evaluaciones activas con estudiantes pendientes por asentar calificación por rúbrica.
                                            </p>
                                        </div>

                                        <div className="guide-step-card">
                                            <div className="guide-step-num"><i className="fas fa-user-graduate"></i></div>
                                            <div className="guide-step-title">Estudiantes Evaluados</div>
                                            <p className="guide-step-desc">
                                                Contador acumulado de calificaciones asentadas exitosamente en el periodo lectivo.
                                            </p>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* Sección 2: Creación y Edición de Rúbricas */}
                            {filterMatches('crear rubricas diseno criterios escalas niveles porcentaje 100 ponderacion descriptores') && (
                                <section className="guide-section" id="crear-rubricas">
                                    <div className="guide-section-header">
                                        <div className="guide-section-icon">
                                            <i className="fas fa-table"></i>
                                        </div>
                                        <div>
                                            <h2>2. Diseño y Creación de Rúbricas</h2>
                                            <span className="guide-badge guide-badge-purple">Metodología</span>
                                        </div>
                                    </div>
                                    <p className="guide-section-lead">
                                        El constructor de rúbricas de SYSRUBR te permite diseñar instrumentos objetivos, estructurados por criterios y niveles de logro.
                                    </p>

                                    <div className="guide-steps-grid">
                                        <div className="guide-step-card">
                                            <div className="guide-step-num">1</div>
                                            <div className="guide-step-title">Datos Básicos</div>
                                            <p className="guide-step-desc">
                                                Asigna un nombre descriptivo (ej: <em>Rúbrica Proyecto Final BD</em>), selecciona la materia y el tipo de escala (General o Analítica).
                                            </p>
                                        </div>

                                        <div className="guide-step-card">
                                            <div className="guide-step-num">2</div>
                                            <div className="guide-step-title">Agregar Criterios</div>
                                            <p className="guide-step-desc">
                                                Añade los criterios que deseas medir (ej: Estructura, Código Limpio, Sustentación Oral).
                                            </p>
                                        </div>

                                        <div className="guide-step-card">
                                            <div className="guide-step-num">3</div>
                                            <div className="guide-step-title">Ponderación al 100%</div>
                                            <p className="guide-step-desc">
                                                Asigna el porcentaje de cada criterio. El sistema validará en tiempo real que la suma total sea exactamente <strong>100%</strong>.
                                            </p>
                                        </div>

                                        <div className="guide-step-card">
                                            <div className="guide-step-num">4</div>
                                            <div className="guide-step-title">Redactar Descriptores</div>
                                            <p className="guide-step-desc">
                                                Especifica con claridad qué comportamiento o evidencia corresponde a cada nivel: <strong>Excelente, Bueno, Regular, Deficiente</strong>.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="guide-callout guide-callout-warning">
                                        <i className="fas fa-exclamation-triangle"></i>
                                        <div>
                                            <strong>Validación Obligatoria:</strong> Para guardar la rúbrica, todos los criterios deben tener descripción y la sumatoria de ponderaciones debe ser exactamente igual a <strong>100%</strong>.
                                        </div>
                                    </div>

                                    <button onClick={() => navigate('/teacher/crear-rubricas')} className="guide-action-btn">
                                        <i className="fas fa-plus-circle"></i> Ir a Crear Rúbrica
                                    </button>
                                </section>
                            )}

                            {/* Sección 3: Planificación y Creación de Evaluaciones */}
                            {filterMatches('evaluaciones planificar crear evaluacion materia seccion fecha limite vincular rubrica') && (
                                <section className="guide-section" id="evaluaciones">
                                    <div className="guide-section-header">
                                        <div className="guide-section-icon">
                                            <i className="fas fa-clipboard-list"></i>
                                        </div>
                                        <div>
                                            <h2>3. Planificación y Asignación de Evaluaciones</h2>
                                            <span className="guide-badge guide-badge-blue">Planificación</span>
                                        </div>
                                    </div>
                                    <p className="guide-section-lead">
                                        Una vez creada la rúbrica, puedes programar la evaluación para tu sección de estudiantes.
                                    </p>

                                    <div className="guide-steps-grid">
                                        <div className="guide-step-card">
                                            <div className="guide-step-num">1</div>
                                            <div className="guide-step-title">Nueva Evaluación</div>
                                            <p className="guide-step-desc">
                                                En <strong>Evaluaciones</strong>, haz clic en el botón <strong>"Nueva Evaluación"</strong>.
                                            </p>
                                        </div>

                                        <div className="guide-step-card">
                                            <div className="guide-step-num">2</div>
                                            <div className="guide-step-title">Selección de Sección y Rúbrica</div>
                                            <p className="guide-step-desc">
                                                Selecciona la materia, la sección a evaluar y la rúbrica previamente diseñada.
                                            </p>
                                        </div>

                                        <div className="guide-step-card">
                                            <div className="guide-step-num">3</div>
                                            <div className="guide-step-title">Establecer Fechas</div>
                                            <p className="guide-step-desc">
                                                Indica la fecha de entrega o defensa. Al guardar, los estudiantes matriculados verán la actividad en su panel.
                                            </p>
                                        </div>
                                    </div>

                                    <button onClick={() => navigate('/teacher/evaluaciones')} className="guide-action-btn">
                                        <i className="fas fa-clipboard-check"></i> Ir a Mis Evaluaciones
                                    </button>
                                </section>
                            )}

                            {/* Sección 4: Calificar con Rúbrica */}
                            {filterMatches('calificar proceso calificacion matriz interactiva notas niveles feedback observaciones cualitativas') && (
                                <section className="guide-section" id="calificar">
                                    <div className="guide-section-header">
                                        <div className="guide-section-icon">
                                            <i className="fas fa-check-double"></i>
                                        </div>
                                        <div>
                                            <h2>4. Proceso de Calificación por Rúbrica en Tiempo Real</h2>
                                            <span className="guide-badge guide-badge-excel">Evaluación en Vivo</span>
                                        </div>
                                    </div>
                                    <p className="guide-section-lead">
                                        SYSRUBR agiliza la corrección mediante una matriz táctil e intuitiva donde calificar toma solo segundos con total precisión.
                                    </p>

                                    <div className="guide-steps-grid">
                                        <div className="guide-step-card">
                                            <div className="guide-step-num">1</div>
                                            <div className="guide-step-title">Abrir Lista de Estudiantes</div>
                                            <p className="guide-step-desc">
                                                En tu evaluación, haz clic en <strong>"Evaluar"</strong> para cargar la nómina de estudiantes.
                                            </p>
                                        </div>

                                        <div className="guide-step-card">
                                            <div className="guide-step-num">2</div>
                                            <div className="guide-step-title">Seleccionar Niveles</div>
                                            <p className="guide-step-desc">
                                                Para cada criterio, pulsa sobre la casilla correspondiente al desempeño demostrado por el alumno.
                                            </p>
                                        </div>

                                        <div className="guide-step-card">
                                            <div className="guide-step-num">3</div>
                                            <div className="guide-step-title">Cálculo Automático</div>
                                            <p className="guide-step-desc">
                                                El sistema computa al instante la nota sobre <strong>20 puntos</strong> según las ponderaciones configuradas.
                                            </p>
                                        </div>

                                        <div className="guide-step-card">
                                            <div className="guide-step-num">4</div>
                                            <div className="guide-step-title">Retroalimentación y Guardado</div>
                                            <p className="guide-step-desc">
                                                Escribe comentarios u observaciones cualitativas para el estudiante y presiona <strong>"Guardar Evaluación"</strong>.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="guide-callout guide-callout-tip">
                                        <i className="fas fa-lightbulb"></i>
                                        <div>
                                            <strong>Transparencia Pedagógica:</strong> En el instante en que guardas la calificación, el estudiante puede visualizar el desglose en su perfil y conocer exactamente sus áreas de oportunidad.
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* Sección 5: Gestión de Estudiantes */}
                            {filterMatches('estudiantes alumnos nomina seccion historial seguimiento') && (
                                <section className="guide-section" id="estudiantes">
                                    <div className="guide-section-header">
                                        <div className="guide-section-icon">
                                            <i className="fas fa-users"></i>
                                        </div>
                                        <div>
                                            <h2>5. Gestión y Seguimiento de Estudiantes</h2>
                                            <span className="guide-badge guide-badge-blue">Nómina</span>
                                        </div>
                                    </div>
                                    <p className="guide-section-lead">
                                        Consulta la nómina de estudiantes inscritos en tus secciones asignadas, verifica su estatus y revisa su historial de calificaciones acumuladas.
                                    </p>

                                    <button onClick={() => navigate('/teacher/estudiantes')} className="guide-action-btn">
                                        <i className="fas fa-users"></i> Ir a Módulo de Estudiantes
                                    </button>
                                </section>
                            )}

                            {/* Sección 6: Reportes y Actas */}
                            {filterMatches('reportes actas exportar pdf excel calificaciones rendimiento promedios') && (
                                <section className="guide-section" id="reportes">
                                    <div className="guide-section-header">
                                        <div className="guide-section-icon">
                                            <i className="fas fa-file-export"></i>
                                        </div>
                                        <div>
                                            <h2>6. Reportes y Exportación de Actas</h2>
                                            <span className="guide-badge guide-badge-excel">Exportación</span>
                                        </div>
                                    </div>
                                    <p className="guide-section-lead">
                                        Genera actas oficiales de notas consolidadas y gráficos de rendimiento por sección con un solo clic.
                                    </p>

                                    <div className="guide-steps-grid">
                                        <div className="guide-step-card">
                                            <div className="guide-step-num"><i className="fas fa-file-pdf text-danger"></i></div>
                                            <div className="guide-step-title">
                                                Actas en Formato PDF <span className="guide-badge guide-badge-pdf">PDF</span>
                                            </div>
                                            <p className="guide-step-desc">
                                                Documentos listos para imprimir con encabezado institucional, desglose de calificaciones y firma docente.
                                            </p>
                                        </div>

                                        <div className="guide-step-card">
                                            <div className="guide-step-num"><i className="fas fa-file-excel text-success"></i></div>
                                            <div className="guide-step-title">
                                                Hojas de Cálculo <span className="guide-badge guide-badge-excel">Excel</span>
                                            </div>
                                            <p className="guide-step-desc">
                                                Exporta las tablas de datos completas para análisis estadístico avanzado o respaldo local.
                                            </p>
                                        </div>
                                    </div>

                                    <button onClick={() => navigate('/teacher/reportes')} className="guide-action-btn">
                                        <i className="fas fa-file-alt"></i> Ir a Reportes Docentes
                                    </button>
                                </section>
                            )}

                            {/* Sección 7: FAQ */}
                            {filterMatches('faq preguntas frecuentes modificar evaluacion duplicar rubrica error 100') && (
                                <section className="guide-section" id="faq">
                                    <div className="guide-section-header">
                                        <div className="guide-section-icon">
                                            <i className="fas fa-question-circle"></i>
                                        </div>
                                        <div>
                                            <h2>7. Preguntas Frecuentes (FAQ)</h2>
                                            <span className="guide-badge guide-badge-blue">Soporte</span>
                                        </div>
                                    </div>

                                    <div className="guide-faq-list">
                                        <div className={`guide-faq-item ${openFaq[0] ? 'open' : ''}`}>
                                            <button className="guide-faq-question" onClick={() => toggleFaq(0)}>
                                                <span>¿Puedo modificar una rúbrica si ya fue utilizada en una evaluación?</span>
                                                <i className="fas fa-chevron-down"></i>
                                            </button>
                                            {openFaq[0] && (
                                                <div className="guide-faq-answer">
                                                    Si. Para proteger la integridad de las calificaciones ya asentadas, cuando modificas una rubrica se ajustara automaticamente la nota de los estudiantes que se evaluaron con la misma. Te recomendamos utilizar la opción de <strong>duplicar o clonar</strong> para crear una nueva versión modificada.
                                                </div>
                                            )}
                                        </div>

                                        <div className={`guide-faq-item ${openFaq[1] ? 'open' : ''}`}>
                                            <button className="guide-faq-question" onClick={() => toggleFaq(0)}>
                                                <span>¿Puedo modificar una evaluación si ya he comenzado a evaluar?</span>
                                                <i className="fas fa-chevron-down"></i>
                                            </button>
                                            {openFaq[1] && (
                                                <div className="guide-faq-answer">
                                                    Si. Para proteger la integridad de las calificaciones ya asentadas, cuando modificas una rubrica se ajustara automaticamente la nota de los estudiantes que se evaluaron con la misma. Te recomendamos utilizar la opción de <strong>duplicar o clonar</strong> para crear una nueva versión modificada.
                                                </div>
                                            )}
                                        </div>

                                        <div className={`guide-faq-item ${openFaq[2] ? 'open' : ''}`}>
                                            <button className="guide-faq-question" onClick={() => toggleFaq(1)}>
                                                <span>¿Puedo corregir o actualizar la calificación de un estudiante?</span>
                                                <i className="fas fa-chevron-down"></i>
                                            </button>
                                            {openFaq[2] && (
                                                <div className="guide-faq-answer">
                                                    Sí. Puedes reabrir la matriz de evaluación del estudiante en la sección de evaluaciones, ajustar los niveles o comentarios cualitativos y guardar nuevamente los cambios.
                                                </div>
                                            )}
                                        </div>

                                        <div className={`guide-faq-item ${openFaq[3] ? 'open' : ''}`}>
                                            <button className="guide-faq-question" onClick={() => toggleFaq(2)}>
                                                <span>¿Qué hago si no me aparece asignada una materia o sección?</span>
                                                <i className="fas fa-chevron-down"></i>
                                            </button>
                                            {openFaq[3] && (
                                                <div className="guide-faq-answer">
                                                    Comunícate con el <strong>Administrador del Sistema</strong> para que verifique tu carga académica en el módulo de Docentes y active los permisos correspondientes.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
