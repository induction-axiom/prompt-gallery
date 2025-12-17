import React from 'react';
import Modal from '../common/Modal';
import { isImageModel, extractImageFromGeminiResult } from '../../utils/geminiParsers';

const TemplateRunner = ({
    template,
    onClose,
    onRun,
    isLoading,
    runResult
}) => {
    const [inputJson, setInputJson] = React.useState('{}');

    React.useEffect(() => {
        if (template) {
            setInputJson('{"object": "banana"}');
        }
    }, [template]);

    const handleRun = () => {
        onRun({ inputJson });
    };
    if (!template) return null;

    return (
        <Modal
            title={`Run: ${template.displayName}`}
            onClose={onClose}
            footer={
                <button onClick={handleRun} disabled={isLoading} className="px-5 py-2.5 text-base rounded-md border border-transparent cursor-pointer transition-opacity hover:opacity-90 inline-flex items-center justify-center bg-[#52c41a] text-white disabled:opacity-60 disabled:cursor-not-allowed">
                    {isLoading ? 'Running...' : 'Run Prompt'}
                </button>
            }
        >
            <div className="mb-[15px]">
                <label className="block mb-[5px] font-bold">Input Variables (JSON)</label>
                <textarea
                    value={inputJson}
                    onChange={(e) => setInputJson(e.target.value)}
                    rows={6}
                    className="w-full p-2 box-border border border-[#ddd] rounded resize-none font-mono bg-[#f9f9f9]"
                />
            </div>

            {runResult && (
                <div className="result-container">
                    <label className="block mb-[5px] font-bold">Result</label>
                    {(() => {
                        if (isImageModel(template)) {
                            const params = extractImageFromGeminiResult(runResult);
                            if (params) {
                                if (params.type === 'base64') {
                                    return (
                                        <img
                                            src={`data:${params.mimeType};base64,${params.data}`}
                                            alt="Generated Content"
                                            className="max-w-full h-auto rounded-md border border-[#eee]"
                                        />
                                    );
                                } else if (params.type === 'url') {
                                    return (
                                        <img
                                            src={params.url}
                                            alt="Generated Content"
                                            className="max-w-full h-auto rounded-md border border-[#eee]"
                                        />
                                    );
                                }
                            }
                        }

                        // Default Text/JSON View
                        return (
                            <pre className="bg-[#f5f5f5] p-[15px] rounded-md overflow-x-auto border border-[#eee] max-h-[200px]">
                                {typeof runResult === 'string' ? runResult : JSON.stringify(runResult, null, 2)}
                            </pre>
                        );
                    })()}
                </div>
            )}
        </Modal>
    );
};

export default TemplateRunner;
