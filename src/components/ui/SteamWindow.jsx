import React from 'react';

export default function SteamWindow({ children, className = '', ...props }) {
    return (
        <div className={`steam-dialog-window p-1 ${className}`} {...props}>
            {children}
        </div>
    );
}
