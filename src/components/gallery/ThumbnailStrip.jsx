import React, { useState } from 'react';
import Tooltip from '../common/Tooltip';

const ThumbnailStrip = ({ items, selectedIndex, onSelect }) => {
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const itemsRef = React.useRef([]);

    const containerRef = React.useRef(null);

    // Ensure the ref array is the correct length
    itemsRef.current = itemsRef.current.slice(0, items.length);

    React.useEffect(() => {
        if (itemsRef.current[selectedIndex] && containerRef.current) {
            const container = containerRef.current;
            const item = itemsRef.current[selectedIndex];

            const containerRect = container.getBoundingClientRect();
            const itemRect = item.getBoundingClientRect();

            // Calculate the position to center the item
            const scrollLeft = item.offsetLeft - (containerRect.width / 2) + (itemRect.width / 2);

            container.scrollTo({
                left: scrollLeft,
                behavior: 'smooth'
            });
        }
    }, [selectedIndex]);

    const handleMouseMove = (e) => {
        setTooltipPos({ x: e.clientX, y: e.clientY });
    };

    return (
        <div
            ref={containerRef}
            className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
        >
            {items.map((item, idx) => {
                const isSelected = selectedIndex === idx;
                const isImage = item.type === 'image' || !!item.imageUrl;

                return (
                    <div
                        key={item.id || idx}
                        ref={el => itemsRef.current[idx] = el}
                        className={`
                            shrink-0 flex items-center justify-center rounded-lg transition-all cursor-pointer 
                            ${isSelected
                                ? 'p-[2px] bg-gradient-to-r from-[#DD2C00] via-[#FF9100] to-[#FFC400]'
                                : 'p-[2px] bg-transparent opacity-70 hover:opacity-100'
                            }
                        `}
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect(idx);
                        }}
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={() => setHoveredIndex(null)}
                    >
                        <div className={`w-16 h-16 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800 ${isSelected ? 'rounded-[calc(0.375rem-2px)]' : ''}`}>
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
