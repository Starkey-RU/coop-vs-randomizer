import React from 'react';

export default function SteamInset({ children, className = '', ...props }) {
    return (
        <div className={`steam-inset-box ${className}`} {...props}>
            {children}
        </div>
    );
}
