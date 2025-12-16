import React from 'react';
import Modal from '../common/Modal';

const TemplateEditor = ({
    isOpen,
    isEditing,
    onClose,
    onSave,
    isLoading,
    initialData
}) => {
    const [displayName, setDisplayName] = React.useState("");
    const [dotPromptString, setDotPromptString] = React.useState("");

    React.useEffect(() => {
        if (isOpen) {
            if (isEditing && initialData) {
                setDisplayName(initialData.displayName || "");
                setDotPromptString(initialData.templateString || "");
            } else {
                setDisplayName("");
                setDotPromptString(`---
model: gemini-2.5-flash
input:
  schema:
    subject: string
---
Tell me a joke about {{subject}}.`);
            }
        }
    }, [isOpen, isEditing, initialData]);

    const handleSave = () => {
        onSave({ displayName, dotPromptString });
    };
    if (!isOpen) return null;

    return (
        <Modal
            title={isEditing ? "Edit Template" : "Create New Template"}
            onClose={onClose}
            footer={
                <>
                    <button onClick={onClose} className="px-5 py-2.5 text-base rounded-md border border-[#ccc] cursor-pointer transition-opacity hover:opacity-90 inline-flex items-center justify-center bg-white">Cancel</button>
                    <button onClick={handleSave} disabled={isLoading} className="px-5 py-2.5 text-base rounded-md border border-transparent cursor-pointer transition-opacity hover:opacity-90 inline-flex items-center justify-center bg-[#1890ff] text-white disabled:opacity-60 disabled:cursor-not-allowed">
                        {isLoading ? 'Saving...' : 'Save Template'}
                    </button>
                </>
            }
        >
            <div className="mb-[15px]">
                <label className="block mb-[5px] font-bold">Display Name</label>
                <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g., Joke Generator"
                    className="w-full p-2 box-border border border-[#ddd] rounded"
                />
            </div>
            <div className="mb-[15px] h-[300px] flex flex-col">
                <label className="block mb-[5px] font-bold">DotPrompt String</label>
                <textarea
                    value={dotPromptString}
                    onChange={(e) => setDotPromptString(e.target.value)}
                    className="w-full p-2 box-border border border-[#ddd] rounded resize-none font-mono flex-1"
                />
            </div>
        </Modal>
    );
};

export default TemplateEditor;
