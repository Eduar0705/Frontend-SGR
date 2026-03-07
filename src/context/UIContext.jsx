import React, { createContext, useState, useContext } from 'react';

const UIContext = createContext();

export function UIProvider({ children }) {
    const [periodoActual, setPeriodoActual] = useState(() => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            return user?.periodo_usuario || null;
        } catch {
            return null;
        }
    });

    const updatePeriodo = (nuevoPeriodo) => {
        setPeriodoActual(nuevoPeriodo);
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (user) {
                user.periodo_usuario = nuevoPeriodo;
                localStorage.setItem('user', JSON.stringify(user));
            }
        } catch (error) {
            console.error('Error updating periodo in localStorage:', error);
        }
    };

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const closeSidebar = () => setIsSidebarOpen(false);
    const openSidebar = () => setIsSidebarOpen(true);

    return (
        <UIContext.Provider value={{
            isSidebarOpen,
            toggleSidebar,
            closeSidebar,
            openSidebar,
            loading,
            setLoading,
            // ✅ FIX: exponer periodoActual y updatePeriodo
            periodoActual,
            updatePeriodo
        }}>
            {children}
        </UIContext.Provider>
    );
}

export function useUI() {
    const context = useContext(UIContext);
    if (!context) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
}