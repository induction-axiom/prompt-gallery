import React from 'react';

const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 border-transparent shadow-md",
    secondary: "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm border",
    danger: "bg-red-50 text-red-600 border-red-100 hover:bg-red-100 border shadow-sm",
    ghost: "bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700 border-transparent"
};

const Button = ({
    children,
    onClick,
    variant = 'secondary',
    className = '',
    disabled = false,
    icon = null,
    type = 'button',
    ...props
}) => {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`
                flex items-center justify-center gap-2 
                px-5 py-2.5 
                font-medium text-sm 
                rounded-full 
                transition-all duration-200 
                active:scale-[0.98]
                disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
                ${variants[variant] || variants.secondary}
                ${className}
            `}
            {...props}
        >
            {icon && <span className="flex-shrink-0">{icon}</span>}
            {children}
        </button>
    );
};

export default Button;
