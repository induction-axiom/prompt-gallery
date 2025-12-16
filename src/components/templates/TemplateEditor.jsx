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
                    <button onClick={onClose} className="btn btn-default">Cancel</button>
                    <button onClick={onSave} disabled={isLoading} className="btn btn-primary">
                        {isLoading ? 'Saving...' : 'Save Template'}
                    </button>
                </>
            }
        >
            <div className="form-group">
                <label className="form-label">Display Name</label>
                <input
                    type="text"
                    value={formDisplayName}
                    onChange={(e) => setFormDisplayName(e.target.value)}
                    placeholder="e.g., Joke Generator"
                    className="form-input"
                />
            </div>
            <div className="form-group vertical-fill">
                <label className="form-label">DotPrompt String</label>
                <textarea
                    value={formDotPromptString}
                    onChange={(e) => setFormDotPromptString(e.target.value)}
                    className="form-textarea monospace"
                />
            </div>
        </Modal>
    );
};

export default TemplateEditor;
