import React from 'react';
import Modal from '../common/Modal';

const TemplateViewer = ({ isOpen, onClose, template }) => {
    if (!isOpen || !template) return null;

    const content = template.templateString || template.dotPromptString || "No content available";
    const templateId = template.name ? template.name.split('/').pop() : '';

    return (
        <Modal
            title={template.displayName || "Prompt Template"}
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
            <div className="flex flex-col h-full max-h-[60vh]">
                {templateId && (
                    <div className="mb-2 text-xs text-gray-400 font-mono select-text">
                        ID: {templateId}
                    </div>
                )}
                <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
                    <pre className="m-0 whitespace-pre-wrap font-mono">
                        {content}
                    </pre>
                </div>
            </div>
        </Modal>
    );
};

export default TemplateViewer;
