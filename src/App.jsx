import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Importar componentes
import Index from './index';
import Login from './auth/login';
import Register from './auth/register';
import Home from './admin/home';
import Docentes from './admin/docentes';
import Student from './students/student';
import Teacher from './teacher/teacher';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Página principal */}
                <Route path="/" element={<Index />} />
                <Route path="/index" element={<Navigate to="/" replace />} />

                {/* Auth */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path='/home' element={<Home />} />
                <Route path='/admin/profesores' element={<Docentes />} />
                
                {/* Rutas para estudiantes y docentes (pueden ser redirigidos desde login según rol) */}
                <Route path="/student" element={<Student />} />
                <Route path="/teacher" element={<Teacher />} />

                {/* Ruta por defecto */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
