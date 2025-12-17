import React, { useState, useEffect } from 'react';
import TextCard from './TextCard';
import ThumbnailStrip from './ThumbnailStrip';

const MixedMediaGallery = ({ items }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Reset selection if items change significantly (optional, but good practice)
    useEffect(() => {
        if (!items || items.length === 0) return;
        if (selectedIndex >= items.length) {
            setSelectedIndex(0);
        }
    }, [items]);

    if (!items || items.length === 0) {
        return (
            <div className="px-5 pb-5 pt-2 flex items-center justify-center bg-gray-50 mx-5 rounded-lg h-40 border-dashed border-2 border-gray-200 text-gray-400 text-sm mb-3">
                No results generated yet
            </div>
        );
    }

    const currentItem = items[selectedIndex];
    const isImage = currentItem.type === 'image' || !!currentItem.imageUrl;

    return (
        <div className="px-5 pb-3">
            {/* Main Hero */}
            <div
                className="w-full h-64 bg-gray-100 rounded-lg mb-3 overflow-hidden flex items-center justify-center border border-gray-100 cursor-pointer relative"
                onClick={() => {
                    if (isImage) {
                        window.open(currentItem.imageUrl, '_blank');
                    }
                }}
            >
                {isImage ? (
                    <img
                        src={currentItem.imageUrl}
                        alt="Generated Result"
                        className="w-full h-full object-contain"
                    />
                ) : (
                    <TextCard content={currentItem.textContent} />
                )}
            </div>

            {/* Thumbnails */}
            <ThumbnailStrip
                items={items}
                selectedIndex={selectedIndex}
                onSelect={setSelectedIndex}
            />
        </div>
    );
};

export default MixedMediaGallery;
