import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Componentes comunes
import { UIProvider, useUI } from './context/UIContext';
import Loader from './components/Loader';

// Componente para vigilar cambios de ruta y resetear loaders residuales
function RouteChangeWatcher() {
    const location = useLocation();
    const { setLoading } = useUI();

    useEffect(() => {
        setLoading(false);
    }, [location.pathname, setLoading]);

    return null;
}

// ── Vistas Públicas y Auth (Carga Diferida) ─────────────────────────
const Index = lazy(() => import('./index'));
const Login = lazy(() => import('./auth/login'));
const Register = lazy(() => import('./auth/register'));
const Recovery = lazy(() => import('./auth/recovery'));
const ResetPassword = lazy(() => import('./auth/resetPassword'));

// ── Vistas de Administrador (Carga Diferida) ────────────────────────
const Home = lazy(() => import('./admin/home'));
const Docentes = lazy(() => import('./admin/docentes'));
const Configuracion = lazy(() => import('./admin/configuracion'));
const Reportes = lazy(() => import('./admin/reportes'));
const CrearRubricas = lazy(() => import('./admin/crearRubrica'));
const EvaluacionDocente = lazy(() => import('./admin/evaluacionDocente'));
const Evaluaciones = lazy(() => import('./admin/evaluaciones'));
const Rubricas = lazy(() => import('./admin/rubricas'));
const PermisosDocente = lazy(() => import('./admin/PermisosDocente'));
const Periodos = lazy(() => import('./admin/periodos'));
const AdminGuias = lazy(() => import('./admin/guias'));

// ── Vistas de Docentes (Carga Diferida) ─────────────────────────────
const Teacher = lazy(() => import('./teacher/teacher'));
const TeacherEvaluaciones = lazy(() => import('./teacher/evaluaciones'));
const TeacherCrearRubricas = lazy(() => import('./teacher/crearRubricas'));
const TeacherEstudiantes = lazy(() => import('./teacher/estudiantes'));
const TeacherReportes = lazy(() => import('./teacher/reportes'));
const TeacherRubrica = lazy(() => import('./teacher/rubricas'));
const TeacherEditarRubrica = lazy(() => import('./teacher/editarRubrica'));
const TeacherGuias = lazy(() => import('./teacher/guias'));

// ── Vistas de Estudiantes y Perfil (Carga Diferida) ──────────────────
const Student = lazy(() => import('./students/student'));
const StudentCalificaciones = lazy(() => import('./students/calificaciones'));
const StudentEvaluaciones = lazy(() => import('./students/evaluaciones'));
const StudentGuias = lazy(() => import('./students/guias'));
const UserProfile = lazy(() => import('./components/UserProfile'));

function AppContent() {
    const { loading } = useUI();
    
    // Función auxiliar para obtener el usuario de forma segura
    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem('user')) || {};
        } catch {
            return {};
        }
    };

    return (
        <BrowserRouter>
            {/* Resetea loaders al cambiar de ruta */}
            <RouteChangeWatcher />

            {/* Loader global para peticiones asíncronas de la API */}
            <Loader show={loading} />
            
            {/* Suspense muestra el Loader mientras se descarga el chunk JS de la vista */}
            <Suspense fallback={<Loader show={true} />}>
                <Routes>
                    {/* Página principal */}
                    <Route path="/" element={<Index />} />
                    <Route path="/index" element={<Navigate to="/" replace />} />

                    {/* Rutas de Autenticación */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/recovery" element={<Recovery />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    
                    {/* Rutas de Administrador */}
                    <Route path='/home' element={<Home />} />
                    <Route path='/admin/profesores' element={<Docentes />} />
                    <Route path='/admin/configuracion' element={<Configuracion />} />
                    <Route path='/admin/reportes' element={<Reportes />} />
                    <Route path='/admin/crear-rubricas' element={<CrearRubricas />} />
                    <Route path='/admin/evaluacion-docente' element={<EvaluacionDocente />} />
                    <Route path='/admin/evaluaciones' element={<Evaluaciones />} />
                    <Route path='/admin/rubricas' element={<Rubricas />} />
                    <Route path='/admin/permisos/:cedula' element={<PermisosDocente />} />
                    <Route path='/admin/periodos' element={<Periodos />} />
                    <Route path='/admin/guias' element={<AdminGuias />} />

                    {/* Rutas para Docentes */}
                    <Route path="/teacher" element={<Teacher />} />
                    <Route path="/teacher/evaluaciones" element={<TeacherEvaluaciones />} />
                    <Route path="/teacher/crear-rubricas" element={<TeacherCrearRubricas />} />
                    <Route path="/teacher/estudiantes" element={<TeacherEstudiantes />} />
                    <Route path="/teacher/reportes" element={<TeacherReportes />} />
                    <Route path="/teacher/rubricas" element={<TeacherRubrica />} />
                    <Route path="/teacher/rubricas/editar/:id" element={<TeacherEditarRubrica />} />
                    <Route path="/teacher/guias" element={<TeacherGuias />} />
                    <Route path="/teacher/config" element={<UserProfile user={getUser()} onLogout={() => window.location.href = '/login'} />} />

                    {/* Rutas para Estudiantes */}
                    <Route path="/student" element={<Student />} />
                    <Route path="/student/calificaciones" element={<StudentCalificaciones />} />
                    <Route path="/student/evaluaciones" element={<StudentEvaluaciones />} />
                    <Route path="/student/guias" element={<StudentGuias />} />
                    <Route path="/student/config" element={<UserProfile user={getUser()} onLogout={() => window.location.href = '/login'} />} />
                    
                    {/* Ruta por defecto */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Suspense>
        </BrowserRouter>
    );
}

function App() {
    return (
        <UIProvider>
            <AppContent />
        </UIProvider>
    );
}

export default App;