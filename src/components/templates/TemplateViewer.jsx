import React from 'react';
import Modal from '../common/Modal';

const TemplateViewer = ({ isOpen, onClose, data, isLoading }) => {
    if (!isOpen) return null;

    return (
        <Modal
            title="Template Details"
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
        </Modal>
    );
};

export default TemplateViewer;
