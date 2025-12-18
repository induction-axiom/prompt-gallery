import React from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { runPromptTemplate } from '../../services/functions';
import { extractTextFromGeminiResult } from '../../utils/geminiParsers';
import { cleanJsonString } from '../../utils/jsonUtils';

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
    const [jsonInputSchema, setJsonInputSchema] = React.useState("");
    const [isGeneratingSchema, setIsGeneratingSchema] = React.useState(false);
    const [isGeneratingName, setIsGeneratingName] = React.useState(false);
    const [isFormatting, setIsFormatting] = React.useState(false);

    React.useEffect(() => {
        if (isOpen) {
            if (isEditing && initialData) {
                setDisplayName(initialData.displayName || "");
                setDotPromptString(initialData.templateString || "");
                setJsonInputSchema(initialData.jsonInputSchema || "");
            } else {
                setDisplayName("");
                setDotPromptString("");
                setJsonInputSchema("");
            }
        }
    }, [isOpen, isEditing, initialData]);

    const handleAutoDetectScore = async () => {
        if (!dotPromptString) return alert("Please enter a prompt first");
        setIsGeneratingSchema(true);
        try {
            const result = await runPromptTemplate({
                templateId: '375a6ce2-efaa-4d22-bf67-4944ce8dc6ed',
                reqBody: { target_template: dotPromptString }
            });

            let parsed = extractTextFromGeminiResult(result.data);
            if (!parsed) parsed = result.data;
            parsed = cleanJsonString(parsed);

            const finalJson = (parsed === '{}' || !parsed) ? '{"object": "banana"}' : parsed;
            setJsonInputSchema(finalJson);
        } catch (error) {
            console.error("Failed to generate default input:", error);
            alert("Failed to auto-detect schema");
        } finally {
            setIsGeneratingSchema(false);
        }
    };

    const handleAutoGenerateName = async () => {
        if (!dotPromptString) return alert("Please enter a prompt first to generate a name");
        setIsGeneratingName(true);
        try {
            const result = await runPromptTemplate({
                templateId: '513d9c40-47d9-46cb-9af7-bb6fa5fec286',
                reqBody: { target_template: dotPromptString }
            });

            const title = extractTextFromGeminiResult(result.data);
            if (title) {
                setDisplayName(title.trim());
            } else {
                alert("Could not generate a title");
            }
        } catch (error) {
            console.error("Failed to generate name:", error);
            alert("Failed to generate name");
        } finally {
            setIsGeneratingName(false);
        }
    };

    const handleAutoFormat = async () => {
        if (!dotPromptString) return alert("Please enter a prompt first to format");
        setIsFormatting(true);
        try {
            const result = await runPromptTemplate({
                templateId: 'c76b911c-cc67-40e6-a1f6-318bb8d13efa',
                reqBody: { rawInput: dotPromptString }
            });

            const formatted = extractTextFromGeminiResult(result.data);
            if (formatted) {
                setDotPromptString(formatted);
            } else {
                alert("Could not format prompt");
            }
        } catch (error) {
            console.error("Failed to format prompt:", error);
            alert("Failed to format prompt");
        } finally {
            setIsFormatting(false);
        }
    };

    const handleSave = () => {
        onSave({ displayName, dotPromptString, jsonInputSchema });
    };

    if (!isOpen) return null;

    return (
        <Modal
            title={isEditing ? "Edit Prompt" : "Upload New Prompt"}
            onClose={onClose}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSave} disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Save Prompt'}
                    </Button>
                </>
            }
        >
            <div className="mb-4">
                <div className="flex justify-between items-center mb-1.5">
                    <label className="block font-bold text-gray-700 dark:text-gray-300">Prompt Name</label>
                    <Button
                        variant="ghost"
                        onClick={handleAutoGenerateName}
                        disabled={isGeneratingName}
                        className="!px-3 !py-1 text-xs"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                        }
                    >
                        {isGeneratingName ? 'Generating...' : 'Auto Generate Name'}
                    </Button>
                </div>
                <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Add a name for this prompt"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-800 dark:text-gray-100"
                />
            </div>
            <div className="mb-4 flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-1.5">
                    <label className="block font-bold text-gray-700 dark:text-gray-300">DotPrompt String</label>
                    <Button
                        variant="ghost"
                        onClick={handleAutoFormat}
                        disabled={isFormatting}
                        className="!px-3 !py-1 text-xs"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                        }
                    >
                        {isFormatting ? 'Formatting...' : 'Auto Format'}
                    </Button>
                </div>
                <textarea
                    value={dotPromptString}
                    onChange={(e) => setDotPromptString(e.target.value)}
                    placeholder="Format your prompt using dotprompt syntax"
                    className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg resize-none font-mono text-sm h-[400px] mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-800 dark:text-gray-100"
                />
                <div className="flex justify-between items-center mb-2">
                    <label className="font-bold text-gray-700 dark:text-gray-300">Input Variables (JSON)</label>
                    <Button
                        variant="ghost"
                        onClick={handleAutoDetectScore}
                        disabled={isGeneratingSchema}
                        className="!px-3 !py-1 text-xs"
                        icon={
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                        }
                    >
                        {isGeneratingSchema ? 'Auto-detecting...' : 'Auto Detect Schema'}
                    </Button>
                </div>
                <textarea
                    value={jsonInputSchema}
                    onChange={(e) => setJsonInputSchema(e.target.value)}
                    placeholder='{"key": ""}'
                    className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg resize-none font-mono text-sm h-[100px] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-800 dark:text-gray-100"
                />
            </div>
        </Modal >
    );
};

export default TemplateEditor;
