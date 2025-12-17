import React from 'react';
import MixedMediaGallery from '../gallery/MixedMediaGallery';
import Tooltip from '../common/Tooltip';
import IconButton from '../common/IconButton';
import Card from '../common/Card';

import { extractModelFromDotPrompt } from '../../utils/geminiParsers';

const TemplateCard = ({ template, onRun, onView, onEdit, onDelete, onDeleteExecution, onToggleLike, onToggleExecutionLike, isLiked, likedExecutionIds, getTemplateId, currentUser }) => {
    const [showTooltip, setShowTooltip] = React.useState(false);
    const [tooltipPos, setTooltipPos] = React.useState({ x: 0, y: 0 });
    const modelName = extractModelFromDotPrompt(template.templateString || template.dotPromptString);

    const handleMouseMove = (e) => {
        setTooltipPos({ x: e.clientX, y: e.clientY });
    };

    return (
        <Card className="h-auto">
            {/* Header Section */}
            <Card.Header
                className="cursor-pointer relative"
                onClick={(e) => { e.stopPropagation(); onView(template); }}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setShowTooltip(false)}
            >
                <div className="flex justify-between items-center bg-white">
                    <h3 className="m-0 text-[#333] font-bold text-lg">{template.displayName}</h3>
                    <span className="text-xs text-gray-400 font-mono">{getTemplateId(template.name)}</span>
                </div>
                {modelName && (
                    <div className="text-xs text-blue-500 font-mono mt-1 bg-blue-50 inline-block px-1 rounded">
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
                />
            </Card.Body>

            {/* Actions Footer */}
            <Card.Footer>
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
            </Card.Footer>
        </Card>
    );
};

export default TemplateCard;
