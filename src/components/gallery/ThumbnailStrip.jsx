import React, { useState } from 'react';
import Tooltip from '../common/Tooltip';

const ThumbnailStrip = ({ items, selectedIndex, onSelect }) => {
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e) => {
        setTooltipPos({ x: e.clientX, y: e.clientY });
    };

    return (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {items.map((item, idx) => {
                const isSelected = selectedIndex === idx;
                const isImage = item.type === 'image' || !!item.imageUrl;

                return (
                    <div
                        key={item.id || idx}
                        className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 cursor-pointer transition-all ${isSelected ? 'border-blue-500 dark:border-blue-400 opacity-100' : 'border-transparent opacity-70 hover:opacity-100'
                            } bg-gray-100 dark:bg-gray-800`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect(idx);
                        }}
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={() => setHoveredIndex(null)}
                    >
                        {isImage ? (
                            <img
                                src={item.imageUrl}
                                alt={`Thumbnail ${idx}`}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300 font-bold text-xs p-1 text-center">
                                <span className="line-clamp-3 overflow-hidden text-[10px] leading-tight">
                                    {item.textContent || "Aa"}
                                </span>
                            </div>
                        )}
                    </div>
                );
            })}
            <Tooltip
                content={hoveredIndex !== null && items[hoveredIndex].inputVariables
                    ? JSON.stringify(items[hoveredIndex].inputVariables, null, 2)
                    : ""}
                visible={hoveredIndex !== null}
                position={tooltipPos}
            />
        </div>
    );
};

export default ThumbnailStrip;
