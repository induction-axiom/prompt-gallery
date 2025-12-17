import React from 'react';

const ThumbnailStrip = ({ items, selectedIndex, onSelect }) => {
    return (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {items.map((item, idx) => {
                const isSelected = selectedIndex === idx;
                const isImage = item.type === 'image' || !!item.imageUrl;

                return (
                    <div
                        key={item.id || idx}
                        className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 cursor-pointer transition-all ${isSelected ? 'border-blue-500 opacity-100' : 'border-transparent opacity-70 hover:opacity-100'
                            } bg-gray-100`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect(idx);
                        }}
                    >
                        {isImage ? (
                            <img
                                src={item.imageUrl}
                                alt={`Thumbnail ${idx}`}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 font-bold text-xs p-1 text-center">
                                <span className="line-clamp-3 overflow-hidden text-[10px] leading-tight">
                                    {item.textContent || "Aa"}
                                </span>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default ThumbnailStrip;
