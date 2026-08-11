import React from 'react';

export default function SteamBox({ title, children, className = '', titleClassName = '', ...props }) {
    return (
        <div className={`steam-group-box ${className}`} {...props}>
            {title && (
                <div className={`flex justify-between items-center px-2 py-1 steam-group-box-title ${titleClassName}`}>
                    {title}
                </div>
            )}
            <div className="p-1">
                {children}
            </div>
        </div>
    );
}
