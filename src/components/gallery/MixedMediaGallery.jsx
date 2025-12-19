import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import TextCard from './TextCard';
import ThumbnailStrip from './ThumbnailStrip';
import IconButton from '../common/IconButton';
import Modal from '../common/Modal';
import Button from '../common/Button';
import UserBadge from '../common/UserBadge';

const MixedMediaGallery = ({ items, currentUser, onDelete, likedExecutionIds = [], onToggleLike, onAuthorClick }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    // Derived state: calculate a safe index based on current items
    // This protects against the race condition where items shrinks (deletion) before state updates
    const safeIndex = Math.min(selectedIndex, items.length - 1);

    // Sync state if necessary (e.g. if we were forced to clamp the index)
    useEffect(() => {
        if (!items || items.length === 0) return;

        // If the stored state is invalid (out of bounds), update it to the safe value
        if (selectedIndex >= items.length) {
            setSelectedIndex(safeIndex);
        }
    }, [items.length, selectedIndex, safeIndex]);

    const handleNext = (e) => {
        e?.stopPropagation();
        if (safeIndex < items.length - 1) {
            setSelectedIndex(safeIndex + 1);
        }
    };

    const handlePrev = (e) => {
        e?.stopPropagation();
        if (safeIndex > 0) {
            setSelectedIndex(safeIndex - 1);
        }
    };

    useEffect(() => {
        if (!isModalOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'ArrowRight') handleNext();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isModalOpen, safeIndex, items.length]);

    if (!items || items.length === 0) {
        return (
            <div className="px-5 pb-3 h-full">
                <div className="w-full h-full min-h-40 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg border-dashed border-2 border-gray-200 dark:border-gray-700 text-gray-400 text-sm mb-3">
                    No creations yet
                </div>
            </div>
        );
    }

    const currentItem = items[safeIndex];
    const isImage = currentItem?.type === 'image' || !!currentItem?.imageUrl;

    return (
        <div className="px-5 pb-3 h-full flex flex-col">
            {/* Main Hero */}
            <div
                className="w-full flex-1 mb-3 overflow-hidden flex items-center justify-center cursor-pointer relative group"
                onClick={() => {
                    setIsModalOpen(true);
                    setIsExpanded(false);
                }}
            >
                <div className="relative max-w-full max-h-full flex justify-center items-center">
                    {/* Delete Button Overlay */}
                    {currentUser && (currentUser.uid === currentItem.creatorId || currentUser.uid === currentItem.userId) ? (
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
                    ) : (
                        /* User Badge for Non-Owners */
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <div
                                onClick={(e) => {
                                    if (onAuthorClick && (currentItem.creatorId || currentItem.userId)) {
                                        e.stopPropagation();
                                        const uid = currentItem.creatorId || currentItem.userId;
                                        const name = currentItem.userProfile?.displayName || 'Unknown';
                                        const photoURL = currentItem.userProfile?.photoURL;
                                        onAuthorClick({ id: uid, displayName: name, photoURL });
                                    }
                                }}
                                className={onAuthorClick ? "cursor-pointer" : ""}
                                title={onAuthorClick ? "Filter by this author" : ""}
                            >
                                <UserBadge user={currentItem.userProfile} className="!py-1 !px-2 text-xs opacity-90 hover:opacity-100" />
                            </div>
                        </div>
                    )}

                    {/* Like Button Wrapper */}
                    <div className="absolute top-2 left-2 z-10">
                        <IconButton
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleLike && onToggleLike(currentItem.id);
                            }}
                            active={likedExecutionIds.includes(currentItem.id)}
                            activeColor="red"
                            label={currentItem.likeCount || 0}
                            icon={
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill={likedExecutionIds.includes(currentItem.id) ? "currentColor" : "none"}
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="w-4 h-4"
                                >
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                </svg>
                            }
                        />
                    </div>

                    {isImage ? (
                        <img
                            src={currentItem.imageUrl}
                            alt="Generated Result"
                            className="w-auto h-auto max-w-full max-h-full object-contain rounded-md border border-gray-200 dark:border-gray-800"
                        />
                    ) : (
                        <TextCard content={currentItem.textContent} />
                    )}
                </div>
            </div>

            {/* Thumbnails */}
            <ThumbnailStrip
                items={items}
                selectedIndex={safeIndex}
                onSelect={setSelectedIndex}
            />

            {/* View Modal */}
            {/* View Modal */}
            {isModalOpen && (
                <>
                    {/* Custom Image Overlay */}
                    {isImage && (
                        <div
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
                            onClick={() => setIsModalOpen(false)}
                        >
                            {/* Navigation Buttons */}
                            {items.length > 1 && (
                                <>
                                    {safeIndex > 0 && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePrev(e);
                                            }}
                                            className="fixed left-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer z-50"
                                            title="Previous"
                                        >
                                            <ChevronLeft size={48} strokeWidth={1.5} />
                                        </button>
                                    )}
                                    {safeIndex < items.length - 1 && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleNext(e);
                                            }}
                                            className="fixed right-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer z-50"
                                            title="Next"
                                        >
                                            <ChevronRight size={48} strokeWidth={1.5} />
                                        </button>
                                    )}
                                </>
                            )}

                            {/* Image Container with Gradient Border */}
                            <div
                                className="relative group max-w-[90vw] max-h-[90vh]"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="p-[3px] rounded-xl bg-gradient-to-r from-[#DD2C00] via-[#FF9100] to-[#FFC400] shadow-2xl">
                                    <img
                                        src={currentItem.imageUrl}
                                        alt="Generated Result"
                                        className="max-h-[85vh] max-w-full object-contain rounded-[9px] bg-black/50"
                                    />
                                </div>

                                {/* Close Button */}
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="absolute -top-4 -right-4 p-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 hover:scale-110 transition-transform cursor-pointer z-50"
                                    title="Close"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Standard Modal for Text */}
                    {!isImage && (
                        <Modal
                            title="Generated Text"
                            onClose={() => setIsModalOpen(false)}
                            maxWidth="max-w-[600px]"
                            footer={
                                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                                    Close
                                </Button>
                            }
                        >
                            {items.length > 1 && (
                                <>
                                    {safeIndex > 0 && (
                                        <button
                                            onClick={handlePrev}
                                            className="absolute left-2 top-1/2 -translate-y-1/2 z-50 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors cursor-pointer border-none flex items-center justify-center h-10 w-10"
                                            title="Previous"
                                        >
                                            <ChevronLeft size={24} />
                                        </button>
                                    )}
                                    {safeIndex < items.length - 1 && (
                                        <button
                                            onClick={handleNext}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 z-50 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors cursor-pointer border-none flex items-center justify-center h-10 w-10"
                                            title="Next"
                                        >
                                            <ChevronRight size={24} />
                                        </button>
                                    )}
                                </>
                            )}
                            <div className="whitespace-pre-wrap text-left dark:text-gray-200">
                                {currentItem.textContent}
                            </div>
                        </Modal>
                    )}
                </>
            )}
        </div>
    );
};

export default MixedMediaGallery;
