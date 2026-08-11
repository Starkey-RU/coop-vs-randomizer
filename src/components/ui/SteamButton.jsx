import React from 'react';

export default function SteamButton({ children, variant = 'default', className = '', ...props }) {
    const baseClass = variant === 'tab' ? 'steam-tab-btn' : 'steam-btn';
    return (
        <button className={`${baseClass} ${className}`} {...props}>
            {children}
        </button>
    );
}
