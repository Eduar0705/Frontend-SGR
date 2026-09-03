import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Menu from '../components/menu';
import Header from '../components/header';
import { useUI } from '../context/UIContext';
import '../assets/css/home.css';
import '../assets/css/guias.css';

export default function StudentGuias() {
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
        } else if (user.id_rol !== 3 && user.id_rol !== 1) {
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
        { id: 'introduccion', title: 'Panel Estudiantil', icon: 'fas fa-home' },
        { id: 'calificaciones', title: 'Mis Calificaciones', icon: 'fas fa-graduation-cap' },
        { id: 'evaluaciones', title: 'Mis Evaluaciones', icon: 'fas fa-clipboard-check' },
        { id: 'rubricas', title: 'Cómo Leer una Rúbrica', icon: 'fas fa-table' },
        { id: 'perfil', title: 'Perfil y Seguridad', icon: 'fas fa-user-shield' },
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
                <Header title="Manual del Estudiante" user={user} onLogout={handleLogout} />

                <div className="guide-container">
                    {/* Hero Banner */}
                    <div className="guide-hero">
                        <div className="guide-hero-content">
                            <span className="guide-badge-role">
                                <i className="fas fa-user-graduate"></i> Módulo del Estudiante
                            </span>
                            <h1><i className="fas fa-book-open"></i> Guía y Manual de Usuario</h1>
                            <p>
                                Bienvenido a la guía oficial de <strong>SGR</strong> para estudiantes. Aprende a consultar tus calificaciones desglosadas por rúbrica, verificar tus próximas evaluaciones y entender los criterios pedagógicos con los que serás evaluado.
                            </p>

                            <div className="guide-search-wrapper">
                                <i className="fas fa-search guide-search-icon"></i>
                                <input
                                    type="text"
                                    className="guide-search-input"
                                    placeholder="Buscar tema (ej. calificaciones, rúbrica, fechas, contraseña)..."
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
                                <i className="fas fa-list-ul"></i> Contenido de la Guía
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
                            {/* Sección 1: Introducción y Panel Estudiantil */}
                            {filterMatches('introduccion panel principal resumen materias promedio evaluaciones') && (
                                <section className="guide-section" id="introduccion">
                                    <div className="guide-section-header">
                                        <div className="guide-section-icon">
                                            <i className="fas fa-home"></i>
                                        </div>
                                        <div>
                                            <h2>1. Panel Principal del Estudiante</h2>
                                            <span className="guide-badge guide-badge-blue">Visión General</span>
                                        </div>
                                    </div>
                                    <p className="guide-section-lead">
                                        Al ingresar al sistema con tu cuenta de estudiante, serás recibido por tu panel principal personalizado con las métricas de tu progreso académico.
                                    </p>

                                    <div className="guide-steps-grid">
                                        <div className="guide-step-card">
                                            <div className="guide-step-num">1</div>
                                            <div className="guide-step-title">
                                                <i className="fas fa-chart-line text-primary"></i> Promedio General
                                            </div>
                                            <p className="guide-step-desc">
                                                Visualiza tu rendimiento académico global ponderado en base a todas las evaluaciones calificadas en el lapso actual.
                                            </p>
                                        </div>

                                        <div className="guide-step-card">
                                            <div className="guide-step-num">2</div>
                                            <div className="guide-step-title">
                                                <i className="fas fa-tasks text-warning"></i> Evaluaciones Pendientes
                                            </div>
                                            <p className="guide-step-desc">
                                                Conoce de inmediato cuántas actividades evaluativas tienes programadas y por presentar.
                                            </p>
                                        </div>

                                        <div className="guide-step-card">
                                            <div className="guide-step-num">3</div>
                                            <div className="guide-step-title">
                                                <i className="fas fa-check-circle text-success"></i> Calificaciones Recientes
                                            </div>
                                            <p className="guide-step-desc">
                                                Accede rápidamente a las últimas notas publicadas por tus docentes con enlace directo al detalle.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="guide-callout guide-callout-info">
                                        <i className="fas fa-info-circle"></i>
                                        <div>
                                            <strong>Consejo de navegación:</strong> Puedes acceder en cualquier momento a tus secciones clave utilizando el menú lateral izquierdo o mediante los botones de acceso directo.
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* Sección 2: Mis Calificaciones */}
                            {filterMatches('calificaciones notas boleta rubrica retroalimentacion feedback profesor materias') && (
                                <section className="guide-section" id="calificaciones">
                                    <div className="guide-section-header">
                                        <div className="guide-section-icon">
                                            <i className="fas fa-graduation-cap"></i>
                                        </div>
                                        <div>
                                            <h2>2. Consulta de Calificaciones y Detalle de Rúbricas</h2>
                                            <span className="guide-badge guide-badge-blue">Evaluación Transparente</span>
                                        </div>
                                    </div>
                                    <p className="guide-section-lead">
                                        En el módulo de <strong>Mis Calificaciones</strong> no solo ves tu nota numérica definitiva (sobre 20 puntos o 100%), sino que tienes acceso completo a la <strong>matriz de evaluación</strong> aplicada por tu docente.
                                    </p>

                                    <div className="guide-steps-grid">
                                        <div className="guide-step-card">
                                            <div className="guide-step-num">1</div>
                                            <div className="guide-step-title">Seleccionar Materia / Lapso</div>
                                            <p className="guide-step-desc">
                                                Filtra tu lista de calificaciones por materia o periodo académico para ver tu historial de notas.
                                            </p>
                                        </div>
                                        <div className="guide-step-card">
                                            <div className="guide-step-num">2</div>
                                            <div className="guide-step-title">Abrir Detalle de Evaluación</div>
                                            <p className="guide-step-desc">
                                                Haz clic en el botón <strong>"Ver Rúbrica"</strong> o el icono de ojo junto a la evaluación deseada.
                                            </p>
                                        </div>
                                        <div className="guide-step-card">
                                            <div className="guide-step-num">3</div>
                                            <div className="guide-step-title">Analizar Criterio por Criterio</div>
                                            <p className="guide-step-desc">
                                                Observa el nivel que obtuviste en cada aspecto evaluado (ej. Contenido, Puntualidad, Defensa) y los comentarios del docente.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="guide-callout guide-callout-tip">
                                        <i className="fas fa-lightbulb"></i>
                                        <div>
                                            <strong>¿Por qué es útil la rúbrica?</strong> Te permite saber con exactitud en qué criterios destacaste y cuáles aspectos debes reforzar para tus próximas evaluaciones.
                                        </div>
                                    </div>

                                    <button onClick={() => navigate('/student/calificaciones')} className="guide-action-btn">
                                        <i className="fas fa-external-link-alt"></i> Ir a Mis Calificaciones
                                    </button>
                                </section>
                            )}

                            {/* Sección 3: Mis Evaluaciones */}
                            {filterMatches('evaluaciones calendario entregas tareas proyectos examenes fechas rubrica previa') && (
                                <section className="guide-section" id="evaluaciones">
                                    <div className="guide-section-header">
                                        <div className="guide-section-icon">
                                            <i className="fas fa-clipboard-check"></i>
                                        </div>
                                        <div>
                                            <h2>3. Próximas Evaluaciones y Criterios Previos</h2>
                                            <span className="guide-badge guide-badge-blue">Planificación</span>
                                        </div>
                                    </div>
                                    <p className="guide-section-lead">
                                        El módulo <strong>Mis Evaluaciones</strong> te muestra el cronograma completo de actividades programadas por tus profesores durante el periodo.
                                    </p>

                                    <div className="guide-steps-grid">
                                        <div className="guide-step-card">
                                            <div className="guide-step-num"><i className="fas fa-calendar-alt"></i></div>
                                            <div className="guide-step-title">Fecha Límite y Estado</div>
                                            <p className="guide-step-desc">
                                                Revisa el estado de la evaluación: <span className="guide-badge guide-badge-amber">Pendiente</span> o <span className="guide-badge guide-badge-excel">Completada</span>, así como la fecha tope de entrega o presentación.
                                            </p>
                                        </div>

                                        <div className="guide-step-card">
                                            <div className="guide-step-num"><i className="fas fa-search-plus"></i></div>
                                            <div className="guide-step-title">Vista Previa de la Rúbrica</div>
                                            <p className="guide-step-desc">
                                                Antes de entregar tu trabajo o hacer tu defensa, puedes revisar la rúbrica con antelación para asegurar que tu entrega cumpla con el nivel <strong>Excelente</strong> en cada criterio.
                                            </p>
                                        </div>
                                    </div>

                                    <button onClick={() => navigate('/student/evaluaciones')} className="guide-action-btn">
                                        <i className="fas fa-external-link-alt"></i> Ir a Mis Evaluaciones
                                    </button>
                                </section>
                            )}

                            {/* Sección 4: Cómo Leer una Rúbrica */}
                            {filterMatches('rubricas como leer estructura niveles criterios escalas ponderacion excelente bueno regular deficiente') && (
                                <section className="guide-section" id="rubricas">
                                    <div className="guide-section-header">
                                        <div className="guide-section-icon">
                                            <i className="fas fa-table"></i>
                                        </div>
                                        <div>
                                            <h2>4. Estructura y Comprensión de una Rúbrica</h2>
                                            <span className="guide-badge guide-badge-purple">Pedagogía</span>
                                        </div>
                                    </div>
                                    <p className="guide-section-lead">
                                        Una rúbrica es una matriz de valoración que desglosa los niveles de desempeño esperados. En SYSRUBR, cada rúbrica cuenta con los siguientes elementos:
                                    </p>

                                    <div className="guide-table-responsive">
                                        <table className="guide-table">
                                            <thead>
                                                <tr>
                                                    <th>Elemento</th>
                                                    <th>Descripción</th>
                                                    <th>Ejemplo en SYSRUBR</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <td><strong>Criterio</strong></td>
                                                    <td>La dimensión o habilidad que se evalúa.</td>
                                                    <td>"Dominio del Tema", "Estructura del Informe", "Defensa Oral"</td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Ponderación (%)</strong></td>
                                                    <td>El peso porcentual que tiene ese criterio sobre la nota final.</td>
                                                    <td>30% sobre el 100% de la actividad.</td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Nivel de Desempeño</strong></td>
                                                    <td>Escala cualitativa y cuantitativa asignada al estudiante.</td>
                                                    <td>
                                                        <span className="guide-badge guide-badge-excel">Excelente (100%)</span>{' '}
                                                        <span className="guide-badge guide-badge-blue">Bueno (75%)</span>{' '}
                                                        <span className="guide-badge guide-badge-amber">Regular (50%)</span>{' '}
                                                        <span className="guide-badge guide-badge-pdf">Deficiente (25%)</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Descriptor</strong></td>
                                                    <td>Explicación clara de lo que se espera para alcanzar cada nivel.</td>
                                                    <td>"Demuestra comprensión profunda y responde con seguridad a todas las preguntas."</td>
                                                </tr>
                                                <tr>
                                                    <td><strong>Retroalimentación</strong></td>
                                                    <td>Observaciones cualitativas personalizadas del docente.</td>
                                                    <td>"Excelente manejo conceptual. Profundizar un poco más en las conclusiones."</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            )}

                            {/* Sección 5: Perfil y Seguridad */}
                            {filterMatches('perfil seguridad contrasena cambiar clave datos usuario') && (
                                <section className="guide-section" id="perfil">
                                    <div className="guide-section-header">
                                        <div className="guide-section-icon">
                                            <i className="fas fa-user-shield"></i>
                                        </div>
                                        <div>
                                            <h2>5. Perfil y Seguridad de la Cuenta</h2>
                                            <span className="guide-badge guide-badge-blue">Cuenta</span>
                                        </div>
                                    </div>
                                    <p className="guide-section-lead">
                                        Mantén tu información personal al día y protege tu cuenta cambiando tu contraseña periódicamente.
                                    </p>

                                    <div className="guide-steps-grid">
                                        <div className="guide-step-card">
                                            <div className="guide-step-num">1</div>
                                            <div className="guide-step-title">Acceder al Perfil</div>
                                            <p className="guide-step-desc">
                                                Haz clic en el icono de engranaje <i className="fas fa-cog text-muted"></i> en la esquina superior derecha del encabezado.
                                            </p>
                                        </div>
                                        <div className="guide-step-card">
                                            <div className="guide-step-num">2</div>
                                            <div className="guide-step-title">Cambiar Contraseña</div>
                                            <p className="guide-step-desc">
                                                Ingresa tu nueva clave (mínimo 6 caracteres) y confírmala en el formulario de seguridad.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="guide-callout guide-callout-warning">
                                        <i className="fas fa-shield-alt"></i>
                                        <div>
                                            <strong>Recomendación de Seguridad:</strong> No compartas tu contraseña ni tu cédula con terceros. Todas las acciones y consultas en el sistema quedan registradas.
                                        </div>
                                    </div>

                                    <button onClick={() => navigate('/student/config')} className="guide-action-btn">
                                        <i className="fas fa-user-cog"></i> Ir a Mi Configuración
                                    </button>
                                </section>
                            )}

                            {/* Sección 6: FAQ */}
                            {filterMatches('faq preguntas frecuentes dudas ayuda reclamo no veo nota') && (
                                <section className="guide-section" id="faq">
                                    <div className="guide-section-header">
                                        <div className="guide-section-icon">
                                            <i className="fas fa-question-circle"></i>
                                        </div>
                                        <div>
                                            <h2>6. Preguntas Frecuentes (FAQ)</h2>
                                            <span className="guide-badge guide-badge-blue">Soporte</span>
                                        </div>
                                    </div>

                                    <div className="guide-faq-list">
                                        <div className={`guide-faq-item ${openFaq[0] ? 'open' : ''}`}>
                                            <button className="guide-faq-question" onClick={() => toggleFaq(0)}>
                                                <span>¿Qué hago si no veo la calificación de una evaluación ya presentada?</span>
                                                <i className="fas fa-chevron-down"></i>
                                            </button>
                                            {openFaq[0] && (
                                                <div className="guide-faq-answer">
                                                    El docente debe completar el proceso de evaluación en su panel para que la nota sea publicada. Si la fecha ya ha pasado y aún no aparece, consúltale a tu profesor o al coordinador de la asignatura.
                                                </div>
                                            )}
                                        </div>

                                        <div className={`guide-faq-item ${openFaq[1] ? 'open' : ''}`}>
                                            <button className="guide-faq-question" onClick={() => toggleFaq(1)}>
                                                <span>¿Cómo puedo saber el valor de cada criterio antes de entregar una tarea?</span>
                                                <i className="fas fa-chevron-down"></i>
                                            </button>
                                            {openFaq[1] && (
                                                <div className="guide-faq-answer">
                                                    Dirígete a la sección <strong>"Mis Evaluaciones"</strong>, ubica la actividad y haz clic en el botón de vista previa de la rúbrica. Allí podrás leer los descriptores de cada nivel y la ponderación porcentual asignada.
                                                </div>
                                            )}
                                        </div>

                                        <div className={`guide-faq-item ${openFaq[2] ? 'open' : ''}`}>
                                            <button className="guide-faq-question" onClick={() => toggleFaq(2)}>
                                                <span>¿Puedo imprimir o guardar mi boleta de calificaciones?</span>
                                                <i className="fas fa-chevron-down"></i>
                                            </button>
                                            {openFaq[2] && (
                                                <div className="guide-faq-answer">
                                                    Proximamente, desde el módulo <strong>Mis Calificaciones</strong> podras utilizar la opción de exportar o imprimir tu resumen académico en cualquier momento.
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
