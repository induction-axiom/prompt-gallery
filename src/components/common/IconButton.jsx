import React from 'react';

const colorVariants = {
    red: "bg-red-50 border-red-100 text-red-500 hover:bg-red-100",
    blue: "bg-blue-50 border-blue-100 text-blue-500 hover:bg-blue-100",
    green: "bg-green-50 border-green-100 text-green-500 hover:bg-green-100",
    default: "bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100"
};

const IconButton = ({
    onClick,
    icon,
    label,
    active = false,
    activeColor = "red", // 'red', 'blue', etc.
    variant = "default", // 'default', 'overlay'
    className = ""
}) => {

    // Base styles
    const baseStyles = "flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all cursor-pointer select-none";

    // Variants
    let variantStyles = "";

    if (variant === 'default') {
        if (active) {
            // Active styles (e.g. Liked)
            // We can map activeColor to classes if needed, for now assuming red implies Like logic or danger
            variantStyles = colorVariants[activeColor] || colorVariants.red;
        } else {
            // Inactive / Default
            variantStyles = "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50";
        }
    } else if (variant === 'overlay') {
        // Overlay style (used in Gallery for delete)
        // Trying to match the shape but adapted for overlay (glassmorphism/white)
        // User asked for consistency. Let's make it look like the white button but simpler?
        // Or keep the dark overlay look but consistent shape?
        // Let's try a white/glass button for overlay to be consistent with "clean simple style"
        variantStyles = "bg-white/90 border-transparent text-gray-600 hover:text-red-500 hover:bg-white shadow-sm border-none";
    }

    return (
        <button
            onClick={onClick}
            className={`${baseStyles} ${variantStyles} ${className}`}
        >
            {icon}
            {label !== undefined && label !== null && (
                <span className="text-xs font-semibold">{label}</span>
            )}
        </button>
    );
};

export default IconButton;
