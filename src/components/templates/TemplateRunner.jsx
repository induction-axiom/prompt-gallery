import React from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { usePromptExecution } from '../../hooks/usePromptExecution';
import { useTemplatesContext } from '../../context/TemplatesContext';
import { extractImageFromGeminiResult, extractTextFromGeminiResult } from '../../utils/geminiParsers';
import { cleanJsonString } from '../../utils/jsonUtils';
import { runPromptTemplate } from '../../services/ai';
import { SYSTEM_PROMPT_IDS } from '../../config/systemPrompts';

const TemplateRunner = ({
    template,
    onClose
}) => {
    const { user, actions } = useTemplatesContext();
    const onSave = actions.handleSaveExecution;

    // Local execution state
    const { isGenerating, runResult, executePrompt, clearResult } = usePromptExecution(user);
    const [inputJson, setInputJson] = React.useState(''); // Start empty to avoid jump
    // Track if user has touched the input to avoid overwriting with slow defaults
    const userEditedRef = React.useRef(false);

    const [isGeneratingRandom, setIsGeneratingRandom] = React.useState(false);
    const resultRef = React.useRef(null);

    React.useEffect(() => {
        if (runResult && !isGenerating) {
            // Small timeout to ensure DOM is updated
            setTimeout(() => {
                resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }, [runResult, isGenerating]);

    React.useEffect(() => {
        if (template) {
            // Reset state for new template
            userEditedRef.current = false;

            // Use stored schema if available, otherwise default to empty object
            // This replaces the auto-detection logic
            const initialJson = template.jsonInputSchema || '{}';
            setInputJson(initialJson);
        }
    }, [template]);

    const handleDiceClick = async () => {
        setIsGeneratingRandom(true);
        try {
            const response = await runPromptTemplate({
                templateId: SYSTEM_PROMPT_IDS.GENERATE_RANDOM_DATA,
                reqBody: {
                    target_template: template.templateString || template.dotPromptString || '',
                    target_schema: inputJson
                }
            });

            let parsed = extractTextFromGeminiResult(response);
            if (!parsed) parsed = response;

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

        executePrompt({
            template,
            inputJson: finalInput,
            onSave: onSave // Pass the save callback to the hook
        });
    };

    if (!template) return null;

    return (
        <Modal
            title={template.displayName}
            onClose={() => {
                clearResult();
                onClose();
            }}
            footer={
                <Button
                    variant="primary"
                    onClick={handleRun}
                    disabled={isGenerating}
                    icon={
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                    }
                >
                    {isGenerating ? 'Running...' : 'Run Prompt'}
                </Button>
            }
        >
            <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                        <label className="font-bold text-gray-700 dark:text-gray-300">Input Variables (JSON)</label>
                    </div>
                    <Button
                        variant="secondary"
                        onClick={handleDiceClick}
                        disabled={isGeneratingRandom}
                        className="!px-3 !py-1.5 text-xs"
                        icon={
                            isGeneratingRandom ? (
                                <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                            )
                        }
                    >
                        {isGeneratingRandom ? 'Generating...' : 'Randomize'}
                    </Button>
                </div>
                <textarea
                    value={inputJson}
                    onChange={(e) => {
                        setInputJson(e.target.value);
                        userEditedRef.current = true;
                    }}
                    placeholder="{}"
                    rows={6}
                    className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg resize-none font-mono bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-gray-200"
                />
            </div>

            <div className="mb-4">
                <label className="block mb-1.5 font-bold text-gray-700 dark:text-gray-300">Prompt Template</label>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap max-h-[400px]">
                    {template.templateString || template.dotPromptString || "No template content"}
                </div>
            </div>

            {isGenerating ? (
                <div className="flex flex-col items-center justify-center p-12 bg-gray-50 dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 min-h-[200px]">
                    <div className="relative mb-4">
                        <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-firebase-orange opacity-20"></div>
                        <div className="relative animate-spin rounded-full h-12 w-12 border-4 border-firebase-orange border-t-transparent shadow-lg text-firebase-orange"></div>
                    </div>
                    <p className="font-semibold text-gray-600 dark:text-gray-300 animate-pulse text-lg">Generating your masterpiece...</p>
                    <p className="text-xs text-gray-400 mt-2">This may take a few moments</p>
                </div>
            ) : (
                runResult && (
                    <div ref={resultRef} className="result-container scroll-mt-4">
                        <label className="block mb-1.5 font-bold text-gray-700 dark:text-gray-300">Result</label>
                        {(() => {
                            // Try to extract image result first, regardless of template type
                            const imageParams = extractImageFromGeminiResult(runResult);
                            if (imageParams) {
                                if (imageParams.type === 'base64') {
                                    return (
                                        <img
                                            src={`data:${imageParams.mimeType};base64,${imageParams.data}`}
                                            alt="Generated Content"
                                            className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
                                        />
                                    );
                                } else if (imageParams.type === 'url') {
                                    return (
                                        <img
                                            src={imageParams.url}
                                            alt="Generated Content"
                                            className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
                                        />
                                    );
                                }
                            }

                            // Default Text/JSON View
                            let content = runResult;
                            const extractedText = extractTextFromGeminiResult(runResult);
                            if (extractedText) content = extractedText;

                            return (
                                <pre className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto border border-gray-200 dark:border-gray-700 max-h-[400px] text-sm dark:text-gray-200 font-mono shadow-inner whitespace-pre-wrap">
                                    {typeof content === 'string' ? content : JSON.stringify(content, null, 2)}
                                </pre>
                            );
                        })()}
                    </div>
                )
            )}
        </Modal>
    );
};

export default TemplateRunner;
