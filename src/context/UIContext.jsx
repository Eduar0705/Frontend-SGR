import React, { createContext, useState, useContext } from 'react';

const UIContext = createContext();

export function UIProvider({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [loading, setLoading] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    const openSidebar = () => {
        setIsSidebarOpen(true);
    };

    return (
        <UIContext.Provider value={{ 
            isSidebarOpen, 
            toggleSidebar, 
            closeSidebar, 
            openSidebar,
            loading,
            setLoading 
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
