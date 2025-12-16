import React from 'react';

const TemplateCard = ({ template, onRun, onEdit, onDelete, getTemplateId }) => {
    return (
        <div className="template-card">
            <div className="template-card-content" onClick={onRun}>
                <h3 className="template-title">{template.displayName}</h3>
                <p className="template-id">
                    ID: {getTemplateId(template.name)}
                </p>
            </div>

            <div className="template-actions">
                <button
                    onClick={onRun}
                    className="btn btn-sm btn-action-run"
                >
                    Run
                </button>
                <button
                    onClick={(e) => onEdit(e, template)}
                    className="btn btn-sm btn-action-edit"
                >
                    Edit
                </button>
                <button
                    onClick={(e) => onDelete(e, template.name)}
                    className="btn btn-sm btn-action-delete"
                >
                    Delete
                </button>
            </div>
        </div>
    );
};

export default TemplateCard;
