import React from 'react';

const TemplateViewer = ({ isOpen, onClose, data, isLoading }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
            <div className="bg-white p-6 rounded-lg w-[90%] max-w-[600px] max-h-[80vh] flex flex-col relative">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 border-none bg-transparent text-xl cursor-pointer"
                >
                    &times;
                </button>
                <h2 className="mt-0 mb-4">Template Details</h2>
                <div className="flex-1 overflow-auto bg-[#f5f5f5] p-2.5 rounded border border-[#ddd]">
                    {isLoading ? (
                        <p>Loading...</p>
                    ) : data ? (
                        <pre className="m-0 whitespace-pre-wrap font-mono text-sm">
                            {JSON.stringify(data, null, 2)}
                        </pre>
                    ) : (
                        <p>No data available</p>
                    )}
                </div>
                <div className="mt-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-[#1890ff] text-white border-none rounded cursor-pointer hover:bg-[#40a9ff]"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TemplateViewer;
