import React from 'react';

const Tooltip = ({ content, visible, position, maxWidth = '400px', maxHeight = '600px' }) => {
    if (!visible) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: position.y + 15,
                left: position.x + 15,
                zIndex: 9999,
                maxWidth: maxWidth,
                maxHeight: maxHeight,
                overflow: 'hidden',
            }}
            className="bg-black/80 text-white p-3 rounded text-xs font-mono shadow-lg backdrop-blur-sm pointer-events-none"
        >
            <div className="line-clamp-[12] whitespace-pre-wrap">
                {content}
            </div>
        </div>
    );
};

export default Tooltip;
