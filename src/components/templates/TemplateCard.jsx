import React from 'react';
import MixedMediaGallery from '../gallery/MixedMediaGallery';

const TemplateCard = ({ template, onRun, onView, onEdit, onDelete, onDeleteExecution, getTemplateId, currentUser }) => {

    return (
        <div className="border border-[#e0e0e0] rounded-xl bg-white shadow-sm flex flex-col h-auto overflow-hidden">
            {/* Header Section */}
            <div className="p-5 pb-3 cursor-pointer" onClick={onRun}>
                <div className="flex justify-between items-start">
                    <h3 className="m-0 mb-1 text-[#333] font-bold text-lg">{template.displayName}</h3>
                    <span className="text-xs text-gray-400 font-mono">{getTemplateId(template.name)}</span>
                </div>
                <p className="m-0 text-[#888] text-sm line-clamp-2">
                    {template.description || "No description provided."}
                </p>
            </div>

            {/* Gallery Section - Hero + Thumbnails */}
            <MixedMediaGallery
                items={template.executions}
                currentUser={currentUser}
                onDelete={(execution) => onDeleteExecution(getTemplateId(template.name), execution)}
            />

            {/* Actions Footer */}
            <div className="mt-auto px-5 py-3 flex justify-end gap-2.5 border-t border-[#f0f0f0] bg-gray-50/50">
                <button
                    onClick={(e) => { e.stopPropagation(); onView(template); }}
                    className="px-3 py-1.5 text-xs rounded opacity-100 hover:opacity-90 inline-flex items-center justify-center border-none cursor-pointer transition-opacity bg-[#f6ffed] text-[#52c41a] font-bold"
                >
                    Read
                </button>
                <button
                    onClick={onRun}
                    className="px-3 py-1.5 text-xs rounded opacity-100 hover:opacity-90 inline-flex items-center justify-center border-none cursor-pointer transition-opacity bg-[#e6f7ff] text-[#1890ff] font-bold"
                >
                    Run
                </button>
                {currentUser && template.ownerId === currentUser.uid && (
                    <>
                        <button
                            onClick={(e) => onEdit(e, template)}
                            className="px-3 py-1.5 text-xs rounded opacity-100 hover:opacity-90 inline-flex items-center justify-center border-none cursor-pointer transition-opacity bg-[#f9f0ff] text-[#722ed1]"
                        >
                            Edit
                        </button>
                        <button
                            onClick={(e) => onDelete(e, template.name)}
                            className="px-3 py-1.5 text-xs rounded opacity-100 hover:opacity-90 inline-flex items-center justify-center border-none cursor-pointer transition-opacity bg-[#fff1f0] text-[#f5222d]"
                        >
                            Delete
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default TemplateCard;
