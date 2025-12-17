import React from 'react';
import Modal from '../common/Modal';
import { isImageModel, extractImageFromGeminiResult, extractTextFromGeminiResult } from '../../utils/geminiParsers';
import { cleanJsonString } from '../../utils/jsonUtils';
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from '../../firebase';

const TemplateRunner = ({
    template,
    onClose,
    onRun,
    isLoading,
    runResult
}) => {
    const [inputJson, setInputJson] = React.useState(''); // Start empty to avoid jump
    // Track if user has touched the input to avoid overwriting with slow defaults
    const userEditedRef = React.useRef(false);
    const [isGeneratingSchema, setIsGeneratingSchema] = React.useState(false);
    const [isGeneratingRandom, setIsGeneratingRandom] = React.useState(false);

    const functions = getFunctions(app);

    React.useEffect(() => {
        if (template) {
            // Reset state for new template
            setInputJson('');
            userEditedRef.current = false;
            fetchDefaultInput();
        }
    }, [template]);

    const fetchDefaultInput = async () => {
        setIsGeneratingSchema(true);
        try {
            // Use system-default-input-generator
            const runFn = httpsCallable(functions, 'runPromptTemplate');
            const result = await runFn({
                templateId: '375a6ce2-efaa-4d22-bf67-4944ce8dc6ed',
                reqBody: { target_template: template.templateString || template.dotPromptString || '' }
            });

            // The result should be a JSON object
            let parsed = extractTextFromGeminiResult(result.data);
            if (!parsed) parsed = result.data; // Fallback to raw data if extraction failed or structure different

            parsed = cleanJsonString(parsed);

            // If empty object or error, fallback to default for known demo
            const finalJson = (parsed === '{}' || !parsed) ? '{"object": "banana"}' : parsed;

            // Only update if user hasn't edited
            if (!userEditedRef.current) {
                setInputJson(finalJson);
            }

        } catch (error) {
            console.error("Failed to generate default input:", error);
            // Fallback
        } finally {
            setIsGeneratingSchema(false);
        }
    };

    const handleDiceClick = async () => {
        setIsGeneratingRandom(true);
        try {
            const runFn = httpsCallable(functions, 'runPromptTemplate');
            const result = await runFn({
                templateId: 'a4f6d8c4-2f01-4281-a833-c7e36aa0dc21',
                reqBody: {
                    target_template: template.templateString || template.dotPromptString || '',
                    target_schema: inputJson
                }
            });

            let parsed = extractTextFromGeminiResult(result.data);
            if (!parsed) parsed = result.data;

            setInputJson(cleanJsonString(parsed));
        } catch (error) {
            console.error("Failed to generate random data:", error);
            alert("Failed to generate random data. See console.");
        } finally {
            setIsGeneratingRandom(false);
        }
    };

    const handleRun = () => {
        // Default to empty object if input is empty
        const finalInput = inputJson.trim() ? inputJson : '{}';
        onRun({ inputJson: finalInput });
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
                <div className="flex justify-between items-center mb-[5px]">
                    <div className="flex items-center gap-2">
                        <label className="font-bold">Input Variables (JSON)</label>
                        {isGeneratingSchema && (
                            <span className="text-xs text-gray-500 flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full animate-pulse">
                                ✨ Auto-detecting...
                            </span>
                        )}
                    </div>
                    <button
                        onClick={handleDiceClick}
                        disabled={isGeneratingRandom || isGeneratingSchema}
                        className="text-xl p-1 hover:bg-gray-100 rounded cursor-pointer disabled:opacity-50"
                        title="Generate Random Data"
                    >
                        {isGeneratingRandom ? '⌛' : '🎲'}
                    </button>
                </div>
                <textarea
                    value={inputJson}
                    onChange={(e) => {
                        setInputJson(e.target.value);
                        userEditedRef.current = true;
                    }}
                    placeholder={isGeneratingSchema ? "Analyzing template..." : "{}"}
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
