import React from 'react';

const Card = ({ children, className = '', ...props }) => {
    return (
        <div
            className={`border border-[#e0e0e0] rounded-xl bg-white shadow-sm flex flex-col overflow-hidden ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};

const Header = ({ children, className = '', ...props }) => {
    return (
        <div className={`p-5 pb-3 bg-white ${className}`} {...props}>
            {children}
        </div>
    );
};

const Body = ({ children, className = '', ...props }) => {
    return (
        <div className={`flex-1 ${className}`} {...props}>
            {children}
        </div>
    );
};

const Footer = ({ children, className = '', ...props }) => {
    return (
        <div className={`mt-auto px-5 py-3 flex items-center justify-between border-t border-[#f0f0f0] bg-gray-50/50 ${className}`} {...props}>
            {children}
        </div>
    );
};

Card.Header = Header;
Card.Body = Body;
Card.Footer = Footer;

export default Card;
