import React, { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import { getPromptTemplate } from '../../services/functions';

const TemplateViewer = ({ isOpen, onClose, template }) => {
    // Local state for fetching full details
    const [fullTemplate, setFullTemplate] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && template) {
            setFullTemplate(template); // Start with partial data
            setError(null);

            const fetchDetails = async () => {
                setLoading(true);
                try {
                    const templateId = template.name.split('/').pop();
                    const result = await getPromptTemplate({ templateId });
                    setFullTemplate({ ...template, ...result.data });
                } catch (err) {
                    console.error("Failed to fetch template details:", err);
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
            };

            fetchDetails();
        } else {
            setFullTemplate(null);
        }
    }, [isOpen, template]);

    if (!isOpen || !template) return null;

    const displayTemplate = fullTemplate || template;
    const content = displayTemplate.templateString || displayTemplate.dotPromptString || "No content available";
    const templateId = displayTemplate.name ? displayTemplate.name.split('/').pop() : '';

    return (
        <Modal
            title={displayTemplate.displayName || "Prompt Template"}
            onClose={onClose}
            footer={
                <button
                    onClick={onClose}
                    className="px-4 py-2 bg-firebase-orange text-white border-none rounded cursor-pointer hover:bg-firebase-red"
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

                {loading && (
                    <div className="text-xs text-firebase-orange mb-2">Fetching latest details...</div>
                )}

                {error && (
                    <div className="text-xs text-red-500 mb-2">Error loading details: {error}</div>
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
