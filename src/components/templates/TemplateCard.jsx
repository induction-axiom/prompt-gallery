import React from 'react';
import MixedMediaGallery from '../gallery/MixedMediaGallery';
import Tooltip from '../common/Tooltip';
import IconButton from '../common/IconButton';
import Card from '../common/Card';
import UserBadge from '../common/UserBadge';

import { extractModelFromDotPrompt } from '../../utils/geminiParsers';

const TemplateCard = ({ template, onRun, onView, onEdit, onDelete, onDeleteExecution, onToggleLike, onToggleExecutionLike, onViewExecution, isLiked, likedExecutionIds, getTemplateId, currentUser }) => {
    const [showTooltip, setShowTooltip] = React.useState(false);
    const [tooltipPos, setTooltipPos] = React.useState({ x: 0, y: 0 });
    const modelName = extractModelFromDotPrompt(template.templateString || template.dotPromptString);

    const [isHovered, setIsHovered] = React.useState(false);

    const handleMouseMove = (e) => {
        setTooltipPos({ x: e.clientX, y: e.clientY });
    };

    const isOwner = currentUser && template.ownerId === currentUser.uid;

    return (
        <Card
            className="h-full"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Header Section */}
            <Card.Header
                className="cursor-pointer relative"
                onClick={(e) => { e.stopPropagation(); onView(template); }}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setShowTooltip(false)}
            >
                <div className="flex justify-between items-center bg-white dark:bg-gray-800">
                    <h3 className="m-0 text-[#333] dark:text-gray-100 font-bold text-lg truncate leading-6 min-h-[1.5rem]" title={template.displayName}>{template.displayName}</h3>
                </div>
                {modelName && (
                    <div className="text-xs text-blue-500 dark:text-blue-400 font-mono mt-1 bg-blue-50 dark:bg-blue-900/30 inline-block px-1 rounded">
                        {modelName}
                    </div>
                )}

                <Tooltip
                    content={template.templateString || template.dotPromptString || "No template string available"}
                    visible={showTooltip}
                    position={tooltipPos}
                />
            </Card.Header>

            {/* Gallery Section - Hero + Thumbnails */}
            <Card.Body>
                <MixedMediaGallery
                    items={template.executions}
                    currentUser={currentUser}
                    onDelete={(execution) => onDeleteExecution(getTemplateId(template.name), execution)}
                    likedExecutionIds={likedExecutionIds}
                    onToggleLike={(executionId) => onToggleExecutionLike(getTemplateId(template.name), executionId)}
                    onView={(executionId) => onViewExecution && onViewExecution(executionId)}
                />
            </Card.Body>

            {/* Action Section - Run Button (Floating Pill) */}
            <div className="relative h-0 z-10 flex justify-center">
                <button
                    onClick={onRun}
                    className="absolute -top-5 flex items-center justify-center gap-2 px-6 py-2.5 bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 font-semibold rounded-full shadow-lg border border-gray-100 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-gray-700 hover:shadow-xl transform transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    Use this prompt
                </button>
            </div>

            {/* Actions Footer */}
            <Card.Footer>
                {/* Like Button Group */}
                <div className="flex items-center gap-2">
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
                    <div className="flex items-center text-gray-400 dark:text-gray-500 text-sm gap-1 ml-1" title="Views">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>{template.viewCount || 0}</span>
                    </div>
                </div>

                <div className="flex justify-end gap-2.5 items-center">
                    {isOwner && isHovered ? (
                        <>
                            <IconButton
                                onClick={(e) => onEdit(e, template)}
                                active={true}
                                activeColor="purple"
                                icon={
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                }
                            />
                            <IconButton
                                onClick={(e) => onDelete(e, template.name)}
                                active={true}
                                activeColor="red"
                                icon={
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                }
                            />
                        </>
                    ) : (
                        <UserBadge user={template.ownerProfile} />
                    )}
                </div>
            </Card.Footer>
        </Card>
    );
};

export default TemplateCard;
