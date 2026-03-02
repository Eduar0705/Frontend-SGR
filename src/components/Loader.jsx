import React from 'react';
import '../assets/css/loader.css';

const Loader = ({ show }) => {
    if (!show) return null;

    return (
        <div className="loader-overlay">
            <div className="loader">
                <div className="justify-content-center jimu-primary-loading"></div>
            </div>
        </div>
    );
};

export default Loader;
