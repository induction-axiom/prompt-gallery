import React from 'react';

const TemplateCard = ({ template, onRun, onView, onEdit, onDelete, getTemplateId, currentUser }) => {
    return (
        <div className="border border-[#e0e0e0] rounded-xl p-5 bg-white shadow-sm flex flex-col h-[180px]">
            <div className="flex-1 cursor-pointer" onClick={onRun}>
                <h3 className="m-0 mb-2.5 text-[#333] font-bold text-lg">{template.displayName}</h3>
                <p className="m-0 text-[#888] text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                    ID: {getTemplateId(template.name)}
                </p>
            </div>

            <div className="mt-[15px] flex justify-end gap-2.5 border-t border-[#f0f0f0] pt-[15px]">
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
