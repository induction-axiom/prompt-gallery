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



    React.useEffect(() => {
        if (isOpen) {
            if (isEditing && initialData) {
                setDisplayName(initialData.displayName || "");
                setDotPromptString(initialData.templateString || "");
                setJsonInputSchema(initialData.jsonInputSchema || "");
            } else {
                setDisplayName("");
                setDotPromptString(`---
model: gemini-3-pro-image-preview
config:
  temperature: 0.9
input:
  schema:
    object: string
---
Create a cute, isometric miniature 3D cartoon scene of a {{object}}. The style should feature soft, refined textures with realistic PBR materials and gentle, lifelike lighting and shadows. Use a clean, minimalistic composition with a soft, solid-colored background.`);
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
                <label className="block mb-1.5 font-bold text-gray-700">Prompt Name</label>
                <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g., 3D Cartoon"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
            </div>
            <div className="mb-4 flex-1 flex flex-col">
                <label className="block mb-1.5 font-bold text-gray-700">DotPrompt String</label>
                <textarea
                    value={dotPromptString}
                    onChange={(e) => setDotPromptString(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none font-mono text-sm h-[400px] mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
                <div className="flex justify-between items-center mb-2">
                    <label className="font-bold text-gray-700">Input Variables (JSON)</label>
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
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none font-mono text-sm h-[100px] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
            </div>
        </Modal >
    );
};

export default TemplateEditor;
