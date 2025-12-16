import React from 'react';
import Modal from '../common/Modal';

const TemplateRunner = ({
    template,
    onClose,
    onRun,
    isLoading,
    runInputJson,
    setRunInputJson,
    runResult
}) => {
    if (!template) return null;

    return (
        <Modal
            title={`Run: ${template.displayName}`}
            onClose={onClose}
            footer={
                <button onClick={onRun} disabled={isLoading} className="btn btn-success">
                    {isLoading ? 'Running...' : 'Run Prompt'}
                </button>
            }
        >
            <div className="form-group">
                <label className="form-label">Input Variables (JSON)</label>
                <textarea
                    value={runInputJson}
                    onChange={(e) => setRunInputJson(e.target.value)}
                    rows={6}
                    className="form-textarea monospace bg-light"
                />
            </div>

            {runResult && (
                <div className="result-container">
                    <label className="form-label">Result</label>
                    <pre className="result-pre">
                        {runResult}
                    </pre>
                </div>
            )}
        </Modal>
    );
};

export default TemplateRunner;
