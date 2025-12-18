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
            <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 h-full max-h-[60vh] text-sm text-gray-600 dark:text-gray-400">
                <pre className="m-0 whitespace-pre-wrap font-mono">
                    {content || "No content available"}
                </pre>
            </div>
        </Modal>
    );
};

export default TemplateViewer;
