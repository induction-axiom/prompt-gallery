import React from 'react';
import Modal from '../common/Modal';

const TemplateEditor = ({
    isOpen,
    isEditing,
    onClose,
    onSave,
    isLoading,
    formDisplayName,
    setFormDisplayName,
    formDotPromptString,
    setFormDotPromptString
}) => {
    if (!isOpen) return null;

    return (
        <Modal
            title={isEditing ? "Edit Template" : "Create New Template"}
            onClose={onClose}
            footer={
                <>
                    <button onClick={onClose} className="px-5 py-2.5 text-base rounded-md border border-[#ccc] cursor-pointer transition-opacity hover:opacity-90 inline-flex items-center justify-center bg-white">Cancel</button>
                    <button onClick={onSave} disabled={isLoading} className="px-5 py-2.5 text-base rounded-md border border-transparent cursor-pointer transition-opacity hover:opacity-90 inline-flex items-center justify-center bg-[#1890ff] text-white disabled:opacity-60 disabled:cursor-not-allowed">
                        {isLoading ? 'Saving...' : 'Save Template'}
                    </button>
                </>
            }
        >
            <div className="mb-[15px]">
                <label className="block mb-[5px] font-bold">Display Name</label>
                <input
                    type="text"
                    value={formDisplayName}
                    onChange={(e) => setFormDisplayName(e.target.value)}
                    placeholder="e.g., Joke Generator"
                    className="w-full p-2 box-border border border-[#ddd] rounded"
                />
            </div>
            <div className="mb-[15px] h-[300px] flex flex-col">
                <label className="block mb-[5px] font-bold">DotPrompt String</label>
                <textarea
                    value={formDotPromptString}
                    onChange={(e) => setFormDotPromptString(e.target.value)}
                    className="w-full p-2 box-border border border-[#ddd] rounded resize-none font-mono flex-1"
                />
            </div>
        </Modal>
    );
};

export default TemplateEditor;
