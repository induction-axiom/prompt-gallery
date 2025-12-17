import React from 'react';

const TextCard = ({ content }) => {
    return (
        <div className="w-full h-full bg-white flex items-center justify-center p-4 overflow-hidden text-center">
            <p className="text-gray-800 text-sm font-medium line-clamp-6" style={{ wordBreak: 'break-word' }}>
                {content || "No text content"}
            </p>
        </div>
    );
};

export default TextCard;
