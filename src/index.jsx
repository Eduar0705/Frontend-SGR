import './assets/css/style.css';
import { useState, useEffect, useRef } from 'react';

export default function Index() {
    // ========================================
    // 1. ESTADOS (Reemplaza variables globales)
    // ========================================
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [activeSection, setActiveSection] = useState('inicio');
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [currentYear, setCurrentYear] = useState('');

    // Referencias para los Intersection Observers (las animaciones al bajar)
    const featuresRef = useRef(null);
    const servicesRef = useRef(null);

    useEffect(() => {
        // Establecer año actual
        setCurrentYear(new Date().getFullYear());

        // Manejador de Scroll
        const handleScroll = () => {
            const scrollPos = window.scrollY;

            setIsScrolled(scrollPos > 50);
            
            setShowScrollTop(scrollPos > 300);

            const sections = ['inicio', 'servicios', 'caracteristicas', 'contacto'];
            for (const section of sections) {
                const element = document.getElementById(section);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    if (rect.top <= 150 && rect.bottom >= 150) {
                        setActiveSection(section);
                        break;
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll);

        const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
        
        const scrollObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const cards = entry.target.querySelectorAll('.animate-on-scroll');
                    cards.forEach((card, index) => {
                        setTimeout(() => {
                            card.classList.add('is-visible');
                        }, index * 100); 
                    });
                    scrollObserver.unobserve(entry.target);
                }
            });
        }, observerOptions);

        if (featuresRef.current) scrollObserver.observe(featuresRef.current);
        if (servicesRef.current) scrollObserver.observe(servicesRef.current);

        // Limpiar eventos al desmontar
        return () => {
            window.removeEventListener('scroll', handleScroll);
            scrollObserver.disconnect();
        };
    }, []);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const scrollToSection = (e, targetId) => {
        e.preventDefault();
        setIsMenuOpen(false);
        
        if (targetId === '#') return;

        const element = document.getElementById(targetId);
        if (element) {
            const navbarHeight = document.querySelector('.navbar').offsetHeight;
            const targetPosition = element.offsetTop - navbarHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <>
            {/* Navigation */}
            <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
                <div className="container nav-container">
                    <a className="navbar-brand" href="#inicio" onClick={(e) => scrollToSection(e, 'inicio')}>
                        <div className="logo-wrapper">
                            <img src="/img/logoiujo.jpg" alt="Logo IUJO" className="logo-img" />
                        </div>
                        <span className="brand-text">Instituto Universitario Jesús Obrero</span>
                    </a>
                    
                    <button className="navbar-toggler" type="button" onClick={toggleMenu}>
                        <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
                    </button>
                    
                    <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
                        <ul className="navbar-nav">
                            <li className="nav-item">
                                <a className={`nav-link ${activeSection === 'inicio' ? 'active-link' : ''}`} href="#inicio" onClick={(e) => scrollToSection(e, 'inicio')}>Inicio</a>
                            </li>
                            <li className="nav-item">
                                <a className={`nav-link ${activeSection === 'servicios' ? 'active-link' : ''}`} href="#servicios" onClick={(e) => scrollToSection(e, 'servicios')}>Servicios</a>
                            </li>
                            <li className="nav-item">
                                <a className={`nav-link ${activeSection === 'caracteristicas' ? 'active-link' : ''}`} href="#caracteristicas" onClick={(e) => scrollToSection(e, 'caracteristicas')}>Características</a>
                            </li>
                            <li className="nav-item">
                                <a className={`nav-link ${activeSection === 'contacto' ? 'active-link' : ''}`} href="#contacto" onClick={(e) => scrollToSection(e, 'contacto')}>Contacto</a>
                            </li>
                            <li className="nav-item nav-btn">
                                <a href="/login" className="btn btn-primary">
                                    <i className="fas fa-sign-in-alt icon-margin"></i>Acceder
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section id="inicio" className="hero-section">
                <div className="hero-overlay"></div>
                <div className="container">
                    <div className="hero-grid">
                        <div className="hero-content">
                            <h1 className="hero-title animate-fade-in">
                                Sistema de Gestión de Rúbricas
                            </h1>
                            <p className="hero-subtitle animate-fade-in-delay">
                                Optimiza tu proceso de evaluación académica con nuestra plataforma integral diseñada para la excelencia educativa
                            </p>
                            <div className="hero-buttons animate-fade-in-delay-2">
                                <a href="/login" className="btn btn-primary btn-lg">
                                    <i className="fas fa-rocket icon-margin"></i>Comenzar Ahora
                                </a>
                                <a href="#servicios" className="btn btn-outline-light btn-lg" onClick={(e) => scrollToSection(e, 'servicios')}>
                                    <i className="fas fa-info-circle icon-margin"></i>Conocer Más
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section id="servicios" className="services-section py-5" ref={servicesRef}>
                <div className="container">
                    <div className="services-grid">
                        <div className="service-card text-center animate-on-scroll hover-lift">
                            <div className="service-icon mb-3">
                                <i className="fas fa-radio"></i>
                            </div>
                            <h5>Radio Fe y Alegría</h5>
                            <p className="text-muted small">Comunicación educativa</p>
                        </div>
                        <div className="service-card text-center animate-on-scroll hover-lift">
                            <div className="service-icon mb-3">
                                <i className="fas fa-laptop"></i>
                            </div>
                            <h5>Aulas Virtuales</h5>
                            <p className="text-muted small">Educación en línea</p>
                        </div>
                        <div className="service-card text-center animate-on-scroll hover-lift">
                            <div className="service-icon mb-3">
                                <i className="fas fa-user-graduate"></i>
                            </div>
                            <h5>Apadrinamiento</h5>
                            <p className="text-muted small">Apoyo estudiantil</p>
                        </div>
                        <div className="service-card text-center animate-on-scroll hover-lift">
                            <div className="service-icon mb-3">
                                <i className="fas fa-clipboard-list"></i>
                            </div>
                            <h5>UPP</h5>
                            <p className="text-muted small">Unidad de Planificación</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="caracteristicas" className="features-section py-5" ref={featuresRef}>
                <div className="container">
                    <div className="text-center mb-5">
                        <h2 className="section-title">Características del Sistema</h2>
                        <p className="section-subtitle">Herramientas diseñadas para facilitar la evaluación académica</p>
                    </div>
                    <div className="features-grid">
                        <div className="feature-card h-100 animate-on-scroll hover-lift">
                            <div className="feature-icon-wrapper">
                                <i className="fas fa-edit"></i>
                            </div>
                            <h4>Creación Intuitiva</h4>
                            <p>Crea rúbricas personalizadas con criterios específicos de forma rápida y sencilla</p>
                        </div>
                        <div className="feature-card h-100 animate-on-scroll hover-lift">
                            <div className="feature-icon-wrapper">
                                <i className="fas fa-users"></i>
                            </div>
                            <h4>Gestión Colaborativa</h4>
                            <p>Comparte y colabora con otros profesores en la creación de rúbricas</p>
                        </div>
                        <div className="feature-card h-100 animate-on-scroll hover-lift">
                            <div className="feature-icon-wrapper">
                                <i className="fas fa-chart-bar"></i>
                            </div>
                            <h4>Análisis Detallado</h4>
                            <p>Obtén reportes y estadísticas completas sobre el desempeño estudiantil</p>
                        </div>
                        <div className="feature-card h-100 animate-on-scroll hover-lift">
                            <div className="feature-icon-wrapper">
                                <i className="fas fa-mobile-alt"></i>
                            </div>
                            <h4>Acceso Multiplataforma</h4>
                            <p>Disponible en computadora, tablet y smartphone con diseño responsive</p>
                        </div>
                        <div className="feature-card h-100 animate-on-scroll hover-lift">
                            <div className="feature-icon-wrapper">
                                <i className="fas fa-shield-alt"></i>
                            </div>
                            <h4>Seguridad Garantizada</h4>
                            <p>Protección de datos con encriptación y cumplimiento normativo</p>
                        </div>
                        <div className="feature-card h-100 animate-on-scroll hover-lift">
                            <div className="feature-icon-wrapper">
                                <i className="fas fa-file-export"></i>
                            </div>
                            <h4>Exportación Flexible</h4>
                            <p>Exporta resultados en múltiples formatos: PDF, Excel, CSV</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer id="contacto" className="footer-section py-5">
                <div className="container">
                    <div className="footer-container">
                        <div className="footer-column brand-column">
                            <div className="footer-brand mb-3">
                                <div className="logo-wrapper">
                                    <img src="/img/logoiujo.jpg" alt="Logo IUJO" className="logo-img" />
                                </div>
                                <span>IUJO</span>
                            </div>
                            <p className="text-white">Instituto Universitario Jesús Obrero - Extensión Barquisimeto</p>
                            <p className="text-white small">Fe y Alegría - Alianza por la Educación</p>
                        </div>
                        
                        <div className="footer-column">
                            <h5>Enlaces</h5>
                            <ul className="footer-links">
                                <li><a href="#inicio" onClick={(e) => scrollToSection(e, 'inicio')}>Inicio</a></li>
                                <li><a href="#servicios" onClick={(e) => scrollToSection(e, 'servicios')}>Servicios</a></li>
                                <li><a href="#caracteristicas" onClick={(e) => scrollToSection(e, 'caracteristicas')}>Características</a></li>
                                <li><a href="/login">Acceder</a></li>
                            </ul>
                        </div>
                        
                        <div className="footer-column">
                            <h5>Soporte</h5>
                            <ul className="footer-links">
                                <li><a href="#">Documentación</a></li>
                                <li><a href="#">Tutoriales</a></li>
                                <li><a href="#">FAQ</a></li>
                                <li><a href="#">Centro de Ayuda</a></li>
                            </ul>
                        </div>
                        
                        <div className="footer-column">
                            <h5>Contacto</h5>
                            <ul className="footer-links text-white">
                                <li className="mb-2"><i className="fas fa-envelope icon-margin"></i>info@iujo.edu.ve</li>
                                <li className="mb-2"><i className="fas fa-phone icon-margin"></i>+58 414 5000000</li>
                                <li><i className="fas fa-map-marker-alt icon-margin"></i>Barquisimeto, Venezuela</li>
                            </ul>
                        </div>
                    </div>
                    
                    <hr className="footer-divider my-4" />
                    
                    <div className="footer-bottom text-center text-white">
                        <p className="mb-0">&copy; <span>{currentYear}</span> IUJO - Sistema de Gestión de Rúbricas. Todos los derechos reservados.</p>
                    </div>
                </div>
            </footer>

            {/* Botón Scroll to Top */}
            <div 
                className={`scroll-top ${showScrollTop ? 'show' : ''}`} 
                onClick={scrollToTop}
                title="Volver arriba"
            >
                <i className="fas fa-arrow-up"></i>
            </div>
        </>
    )
}