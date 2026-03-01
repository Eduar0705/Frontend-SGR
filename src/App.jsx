import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Importar componentes
import Index from './index';
import Login from './auth/login';
import Register from './auth/register';

//Importar archivos de Administrador
import Home from './admin/home';
import Docentes from './admin/docentes';
import Configuracion from './admin/configuracion';
import Reportes from './admin/reportes';
import CrearRubricas from './admin/crearRubrica';
import EvaluacionDocente from './admin/evaluacionDocente';
import Evaluaciones from './admin/evaluaciones';
import Rubricas from './admin/rubricas';

//Importar archivos de Docentes
import Teacher from './teacher/teacher';
import TeacherEvaluaciones from './teacher/evaluaciones';
import TeacherCrearRubricas from './teacher/crearRubricas';
import TeacherEstudiantes from './teacher/estudiantes';
import TeacherReportes from './teacher/reportes';
import TeacherRubrica from './teacher/rubricas';
import TeacherEditarRubrica from './teacher/editarRubrica';

//Importar archivos de Estudiantes
import Student from './students/student';
import StudentCalificaciones from './students/calificaciones';
import StudentEvaluaciones from './students/evaluaciones';

import { UIProvider } from './context/UIContext';

function App() {
    return (
        <UIProvider>
            <BrowserRouter>
                <Routes>
                    {/* Página principal */}
                    <Route path="/" element={<Index />} />
                    <Route path="/index" element={<Navigate to="/" replace />} />

                    {/* Auth */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    
                    {/* Rutas de Administrador */}
                    <Route path='/home' element={<Home />} />
                    <Route path='/admin/profesores' element={<Docentes />} />
                    <Route path='/admin/configuracion' element={<Configuracion />} />
                    <Route path='/admin/reportes' element={<Reportes />} />
                    <Route path='/admin/crear-rubricas' element={<CrearRubricas />} />
                    <Route path='/admin/evaluacion-docente' element={<EvaluacionDocente />} />
                    <Route path='/admin/evaluaciones' element={<Evaluaciones />} />
                    <Route path='/admin/rubricas' element={<Rubricas />} />

                    {/* Rutas para Docentes*/}
                    <Route path="/teacher" element={<Teacher />} />
                    <Route path="/teacher/evaluaciones" element={<TeacherEvaluaciones />} />
                    <Route path="/teacher/crear-rubricas" element={<TeacherCrearRubricas />} />
                    <Route path="/teacher/estudiantes" element={<TeacherEstudiantes />} />
                    <Route path="/teacher/reportes" element={<TeacherReportes />} />
                    <Route path="/teacher/rubricas" element={<TeacherRubrica />} />
                    <Route path="/teacher/rubricas/editar/:id" element={<TeacherEditarRubrica />} />

                    {/* Rutas para Estudiantes*/}
                    <Route path="/student" element={<Student />} />
                    <Route path="/student/calificaciones" element={<StudentCalificaciones />} />
                    <Route path="/student/evaluaciones" element={<StudentEvaluaciones />} />

                    {/* Ruta por defecto */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </UIProvider>
    );
}

export default App;
