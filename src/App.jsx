import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Importar componentes
import Index from './index';
import Login from './auth/login';
import Register from './auth/register';

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

                {/* Ruta por defecto */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
