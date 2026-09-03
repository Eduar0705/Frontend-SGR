import React from 'react';

/**
 * Componente reutilizable de carga con círculo giratorio (spinner).
 * 
 * @param {string} text - Texto descriptivo opcional (por defecto 'Cargando...')
 * @param {string} size - Tamaño del círculo: 'sm' (24px), 'md' (40px, default), 'lg' (56px)
 * @param {string} color - Color principal del borde del spinner (por defecto '#1e3a8a')
 * @param {string|number} padding - Padding del contenedor (por defecto '40px')
 * @param {boolean} inline - Si debe mostrarse en línea en lugar de bloque centrado
 */
export default function LoadingSpinner({
    text = 'Cargando...',
    size = 'md',
    color = '#1e3a8a',
    padding = '40px',
    inline = false,
    style = {}
}) {
    const sizeMap = {
        sm: { size: 24, borderWidth: 3, fontSize: '0.85rem' },
        md: { size: 40, borderWidth: 4, fontSize: '0.95rem' },
        lg: { size: 54, borderWidth: 5, fontSize: '1.05rem' }
    };

    const config = sizeMap[size] || sizeMap.md;

    const spinnerStyle = {
        width: config.size + 'px',
        height: config.size + 'px',
        border: config.borderWidth + 'px solid #e2e8f0',
        borderTop: config.borderWidth + 'px solid ' + color,
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        flexShrink: 0
    };

    if (inline) {
        return (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', ...style }}>
                <div style={spinnerStyle} />
                {text && <span style={{ color: '#64748b', fontSize: config.fontSize }}>{text}</span>}
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: padding,
            gap: '14px',
            width: '100%',
            ...style
        }}>
            <div style={spinnerStyle} />
            {text && <p style={{ margin: 0, color: '#64748b', fontSize: config.fontSize, fontWeight: '500' }}>{text}</p>}
        </div>
    );
}
