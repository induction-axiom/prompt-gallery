import React, { useState, useEffect } from 'react';
import TextCard from './TextCard';
import ThumbnailStrip from './ThumbnailStrip';
import IconButton from '../common/IconButton';

const MixedMediaGallery = ({ items, currentUser, onDelete }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Reset selection if items change significantly (optional, but good practice)
    useEffect(() => {
        if (!items || items.length === 0) return;
        if (selectedIndex >= items.length) {
            setSelectedIndex(0);
        }
    }, [items, selectedIndex]);

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
                className="w-full h-64 bg-gray-100 rounded-lg mb-3 overflow-hidden flex items-center justify-center border border-gray-100 cursor-pointer relative group"
                onClick={() => {
                    if (isImage) {
                        window.open(currentItem.imageUrl, '_blank');
                    }
                }}
            >
                {/* Delete Button Overlay */}
                {currentUser && (currentUser.uid === currentItem.creatorId || currentUser.uid === currentItem.userId) && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <IconButton
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete && onDelete(currentItem);
                            }}
                            variant="overlay"
                            icon={
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            }
                            title="Delete this result"
                        />
                    </div>
                )}

                {/* Content */}
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
