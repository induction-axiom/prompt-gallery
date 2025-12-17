import React from 'react';
import MixedMediaGallery from '../gallery/MixedMediaGallery';
import Tooltip from '../common/Tooltip';
import IconButton from '../common/IconButton';

const TemplateCard = ({ template, onRun, onView, onEdit, onDelete, onDeleteExecution, onToggleLike, isLiked, getTemplateId, currentUser }) => {
    const [showTooltip, setShowTooltip] = React.useState(false);
    const [tooltipPos, setTooltipPos] = React.useState({ x: 0, y: 0 });

    const handleMouseMove = (e) => {
        setTooltipPos({ x: e.clientX, y: e.clientY });
    };

    return (
        <div className="border border-[#e0e0e0] rounded-xl bg-white shadow-sm flex flex-col h-auto overflow-hidden">
            {/* Header Section */}
            <div
                className="p-5 pb-3 cursor-pointer relative"
                onClick={(e) => { e.stopPropagation(); onView(template); }}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setShowTooltip(false)}
            >
                <div className="flex justify-between items-start">
                    <h3 className="m-0 mb-1 text-[#333] font-bold text-lg">{template.displayName}</h3>
                    <span className="text-xs text-gray-400 font-mono">{getTemplateId(template.name)}</span>
                </div>
                <p className="m-0 text-[#888] text-sm line-clamp-2">
                    {template.description || "No description provided."}
                </p>

                <Tooltip
                    content={template.templateString || template.dotPromptString || "No template string available"}
                    visible={showTooltip}
                    position={tooltipPos}
                />
            </div>

            {/* Gallery Section - Hero + Thumbnails */}
            <MixedMediaGallery
                items={template.executions}
                currentUser={currentUser}
                onDelete={(execution) => onDeleteExecution(getTemplateId(template.name), execution)}
            />

            {/* Actions Footer */}
            <div className="mt-auto px-5 py-3 flex items-center justify-between border-t border-[#f0f0f0] bg-gray-50/50">
                {/* Like Button Group */}
                <IconButton
                    onClick={(e) => { e.stopPropagation(); onToggleLike(getTemplateId(template.name)); }}
                    active={isLiked}
                    activeColor="red"
                    label={template.likeCount || 0}
                    icon={
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill={isLiked ? "currentColor" : "none"}
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

                <div className="flex justify-end gap-2.5">
                    <button
                        onClick={onRun}
                        className="px-3 py-1.5 text-xs rounded opacity-100 hover:opacity-90 inline-flex items-center justify-center border-none cursor-pointer transition-opacity bg-[#e6f7ff] text-[#1890ff] font-bold"
                    >
                        Run
                    </button>
                    {currentUser && template.ownerId === currentUser.uid && (
                        <>
                            <IconButton
                                onClick={(e) => onEdit(e, template)}
                                active={true}
                                activeColor="purple"
                                icon={
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                }
                            />
                            <IconButton
                                onClick={(e) => onDelete(e, template.name)}
                                active={true}
                                activeColor="red"
                                icon={
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                }
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TemplateCard;
