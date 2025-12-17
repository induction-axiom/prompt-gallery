import React from 'react';
import Modal from '../common/Modal';

const TemplateViewer = ({ isOpen, onClose, content }) => {
    if (!isOpen) return null;

    return (
        <Modal
            title="Prompt Template"
            onClose={onClose}
            footer={
                <button
                    onClick={onClose}
                    className="px-4 py-2 bg-[#1890ff] text-white border-none rounded cursor-pointer hover:bg-[#40a9ff]"
                >
                    Close
                </button>
            }
        >
            <div className="flex-1 overflow-auto bg-[#f5f5f5] p-2.5 rounded border border-[#ddd] h-full max-h-[60vh]">
                <pre className="m-0 whitespace-pre-wrap font-mono text-sm">
                    {content || "No content available"}
                </pre>
            </div>
        </Modal>
    );
};

export default TemplateViewer;
