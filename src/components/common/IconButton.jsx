import React from 'react';

const colorVariants = {
    red: "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40",
    blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900/30 text-blue-500 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40",
    green: "bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30 text-green-500 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40",
    purple: "bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40",
    default: "bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
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
            variantStyles = colorVariants[activeColor] || colorVariants.red;
        } else {
            // Inactive / Default
            variantStyles = "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700";
        }
    } else if (variant === 'overlay') {
        // Overlay style (used in Gallery for delete)
        // Trying to match the shape but adapted for overlay (glassmorphism/white)
        variantStyles = "bg-white/90 dark:bg-gray-800/90 border-transparent text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 hover:bg-white dark:hover:bg-gray-800 shadow-sm border-none";
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
