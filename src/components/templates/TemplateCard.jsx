import React from 'react';

const TemplateCard = ({ template, onRun, onView, onEdit, onDelete, getTemplateId, currentUser }) => {
    const [heroImage, setHeroImage] = React.useState(null);

    // Initialize hero image when template.executions changes
    React.useEffect(() => {
        if (template.executions && template.executions.length > 0) {
            setHeroImage(template.executions[0].imageUrl);
        } else {
            setHeroImage(null);
        }
    }, [template.executions]);

    const hasImages = template.executions && template.executions.length > 0;

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
            {hasImages ? (
                <div className="px-5 pb-3">
                    {/* Hero Image */}
                    <div
                        className="w-full h-64 bg-gray-100 rounded-lg mb-3 overflow-hidden flex items-center justify-center border border-gray-100 cursor-pointer"
                        onClick={() => window.open(heroImage, '_blank')}
                    >
                        {heroImage ? (
                            <img
                                src={heroImage}
                                alt="Generated Result"
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <span className="text-gray-400 text-sm">Select an image</span>
                        )}
                    </div>

                    {/* Thumbnails */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                        {template.executions.slice(0, 5).map((exec, idx) => (
                            <div
                                key={exec.id || idx}
                                className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 cursor-pointer transition-all ${heroImage === exec.imageUrl ? 'border-blue-500 opacity-100' : 'border-transparent opacity-70 hover:opacity-100'
                                    }`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setHeroImage(exec.imageUrl);
                                }}
                            >
                                <img
                                    src={exec.imageUrl}
                                    alt={`Thumbnail ${idx}`}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="px-5 pb-5 pt-2 flex items-center justify-center bg-gray-50 mx-5 rounded-lg h-40 border-dashed border-2 border-gray-200 text-gray-400 text-sm mb-3">
                    No images generated yet
                </div>
            )}

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
